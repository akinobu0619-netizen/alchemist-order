# SPEC: 戦闘の深み（パッケージA）— 能力ランク・技タグ・タイプ個性・守護者ボス化

実装=Opus / バランス検証=Sonnet(勝率シミュ) / FX連携=パッケージB(QUALITY_PLAN参照)。
**目的**: 「相性の良い最大威力を連打」が最適解でなくなり、ターンごとに意思決定（積むか/殴るか/守るか/入れ替えるか）が生まれる状態。

---

## 1. データモデル変更

### 1-1. Move 型拡張（src/types.ts）
```ts
interface Move {
  // ...既存 (id/name/type/category/power/acc/desc/inflict/heal/cures)
  priority?: number            // 行動順ボーナス(+1=先制)。省略=0
  multi?: [number, number]     // 連続攻撃 [最小,最大]回。命中判定は1回、ダメージは各ヒットで乱数
  recoil?: number              // 与ダメ×この割合を自分が受ける(最低1)。自滅あり得る(それがリスク)
  drain?: number               // 与ダメ×この割合を回復(最低1、maxHp上限)
  guard?: boolean              // このターン被ダメ×0.3。連続選択不可(直前に使った技がguardなら選択不可・AIも同ルール)
  charge?: boolean             // 溜め技: T1=溜め(PP消費・行動固定化)、T2=威力そのままで解放(powerに2倍込みの値を設定する)
  critBoost?: number           // 会心率の上書き(既定0.06)。例 0.25
  bonusVsStatus?: number       // 相手が状態異常なら威力×この値。例 1.5
  buffs?: { target: 'self' | 'foe'; stat: 'atk' | 'def' | 'spd' | 'mag'; delta: number }[]  // ランク操作(±1/±2)
}
```

### 1-2. Combatant 拡張（src/types.ts）
```ts
interface Combatant {
  // ...既存
  stages: { atk: number; def: number; spd: number; mag: number } // 各 -3..+3。makeCombatantで全0初期化
  guarding?: boolean       // guard中(次の自分の行動開始時に解除)
  lastMoveId?: string      // guard連続使用禁止の判定用
  charging?: string        // 溜め中の技id(次ターン自動解放)
}
```

### 1-3. TrainerData のチーム拡張（src/types.ts / maps.ts）
```ts
team: { speciesId: string; level: number; talent?: number; heldItem?: string; moves?: string[] }[]
// moves は技idリスト(下記レジストリで解決)。省略時は従来通り getMoveset(level)
```
技idレジストリ `moveById(id, sp)` を moves.ts に追加（TYPE_KIT全技＋`sig`=signatureMove(sp)を解決）。

---

## 2. 能力ランク（ステージ）の厳密仕様

- 範囲: **-3〜+3**。倍率: `stage>=0 ? (3+stage)/3 : 3/(3-stage)`
  → +1=1.33 / +2=1.67 / +3=2.0 / -1=0.75 / -2=0.6 / -3=0.5
- 適用箇所（calcDamage/effectiveSpeed）:
  - 攻撃側: `atkStat = 実atk(or mag) × stageMult` を**やけど半減・剛力より前**に適用
  - 防御側: `defStat = 実def × stageMult(def)`
  - 速度: `effectiveSpeed = 実spd × stageMult(spd)`（まひ半減はその後）
- 上限時: 「これ以上 あがらない！」を表示、**PPは消費**
- リセット: **交代で交代した個体のランクを全リセット**。バトル終了でも当然消滅。敵の次の個体は0から
- ログ文言: +1「〜の こうげきが 上がった！」/ +2「ぐーんと上がった！」/ -1「下がった！」/ -2「がくっと下がった！」
- UI: info-plate に非0ステージのみチップ表示（例 `攻▲▲ 速▼`。▲=+1つ分）

## 3. 会心（クリティカル）の新設

- 基礎会心率 **6%**、`critBoost` があればその値に置換。ダメージ**×1.5**、eff===0なら発生しない
- メッセージ「急所に 当たった！」＋白フラッシュ(パッケージB)
- 既存UIの `crit` クラス（eff>=2で使用中）と区別すること: 相性演出とは別物

## 4. 技タグの処理順序（doMove内の正準シーケンス）

1. **charge判定**: attacker.charging===move.id なら解放（下記5へ）。そうでなく move.charge なら「(名前)は 力を溜めている…！」→ charging=move.id, PP消費, ターン終了
2. 命中判定（1回。multiでも1回）
3. **ヒットループ**（multi ? randInt(min,max)回 : 1回）: 各ヒットで calcDamage（乱数each）→ 頑丈判定(各ヒット・満タン時のみ)→HP減算→ポップアップ(160ms間隔)。multiは最後に「N回 当たった！」
4. 会心はヒットごとに個別判定
5. ダメージ後効果の順: **drain回復 → recoil自傷 → 回復の実(berry) → 毒手 → move.inflict → buffs適用**
6. guard技(power0): guarding=true をセット、「(名前)は 身を守っている！」。**被ダメ計算時×0.3**（ward/もちものと乗算）。自分の次の行動開始時に解除
7. bonusVsStatus: calcDamage内で defender.status!=null なら威力×値
8. lastMoveId を更新（guard連続使用禁止: UI無効化＋AI選択除外）

**行動順**: `priority降順 → effectiveSpeed降順 → プレイヤー優先`。準備(charge解放)は選択不能でその技のpriorityに従う。

## 5. タイプ別キット再配分表（moves.ts改修の正準表）

TypeKit を `basic / tech / rush / aura / blast` の5枠に拡張。習得: **L1たいあたり, L1 basic, L7 tech, L10 rush, L14 aura, L18 blast, L22 固有技**（複合はL16に副属性blast）。
→ 最新4枠ルールにより最終形: 単タイプ=[rush, aura, blast, 固有] / 複合=[aura, 副blast, blast, 固有]。

| タイプ | rush(L10・タグ攻撃) | aura(L14・ランク/守り) | 既存techとの合わせ技(狙い) |
|---|---|---|---|
| 火 | **フレイムダッシュ** phys70 acc0.95 recoil0.25 | **とうき** self atk+2 | やけどtech＋反動＝ハイリスク砲台 |
| 水 | **うずしお** spec65 acc0.9 buffs:[foe spd-1] | **みずのまく** self def+2 | こおりtech＋鈍足化＋硬化＝持久 |
| 風 | **かぜのやいば** phys40 acc1.0 priority+1 | **おいかぜ** self spd+2 | 先制＋加速＝手数で翻弄 |
| 地 | **いわなだれ** phys30 acc0.9 multi[2,3] | **まもりがため** guard | ねむりtech＋ガード＝受けて反す |
| 雷 | **らいげき** spec65 acc0.9 critBoost0.25 | **じゅうでん** self mag+2 | まひtech＋高会心＝博打 |
| 毒 | **ベノムショック** spec65 acc0.95 bonusVsStatus1.5 | **ようかいえき** foe def-2 | どく重ね→追撃＝じわじわ |
| 聖 | **ひかりのはどう** spec60 acc1.0(必中) | **加護の光** self buffs:[def+1, mag+1] | 回復tech＋二重バフ＝サポート |
| 冥 | **ソウルドレイン** spec60 acc0.95 drain0.5 | **のろいのまなざし** foe atk-2 | 灰化tech＋吸収＋弱体＝闇の代償 |
| 錬成 | **オーバーチャージ** spec120 acc0.9 charge | **ちょうりつ** 相手の全ランクを0にリセット | 変則ユーティリティ |

- 技id命名: `<type>_r`(rush) / `<type>_a`(aura)。PPは既存導出式(status=10、power120→5)
- 「ちょうりつ」実装: category status、効果=foeのstages全0化。「(相手)の能力変化が 打ち消された！」
- 固有技(sig)は現状維持(spec85/acc0.9)。ただし**雷タイプの固有技のみ critBoost0.12** を付与(タイプ個性の駄目押し・任意)

## 6. 守護者ロードアウト表（ボス化）

チーム拡張(1-3)を使用。**エースはtalent・もちもの・カスタム技**持ち。「開幕ギミック」=AI規則(§7)で最初の行動を固定。

### 森の守護者シルヴァ（持久型・目標: プレイヤーLv12前後で初見勝率50-60%）
| 枠 | 種 | Lv | talent | もちもの | 技(moves指定) | 意図 |
|---|---|---|---|---|---|---|
| 1 | sporin | 10 | 0 | - | 既定 | 露払い・どく撒き |
| 2 | mandrago | 12 | 3 | - | earth_t(ねむりごな), earth_r(いわなだれ), pois_x, earth_b | 眠らせて連撃 |
| ACE | alraune | 14 | 6 | lifering | earth_a(まもりがため), earth_t, pois_x, sig | **開幕まもりがため**→眠らせて削る要塞 |

### 港の守護者マレア（波状攻撃型・目標: Lv19前後で勝率50-60%）
| 枠 | 種 | Lv | talent | もちもの | 技 | 意図 |
|---|---|---|---|---|---|---|
| 1 | shelk | 17 | 0 | - | 既定 | 硬い前座 |
| 2 | aquab | 18 | 3 | - | water_r(うずしお), water_t, water_x, water_b | 鈍足化で流れを作る |
| ACE | marinel | 21 | 6 | oranberry | water_a(みずのまく), water_r, water_x, sig | **開幕みずのまく**→うずしおで封殺 |

### （第3世界用テンプレ）火山の守護者イグナート（目標Lv26前後）
| 枠 | 種 | Lv | talent | もちもの | 技 | 意図 |
|---|---|---|---|---|---|---|
| 1 | 火stage2任意 | 24 | 0 | - | 既定 | - |
| 2 | 火stage2任意 | 25 | 3 | - | fire_r, fire_t, fire_x, fire_b | 反動殴り |
| ACE | ignisleo | 27 | 6 | powerband | fire_a(とうき), fire_r, fire_x, sig | **開幕とうき**→反動込みの重撃 |

## 7. 敵AI拡張（chooseEnemyMove）

優先順で評価（既存の回復/状態ロジックは維持しつつ追加）:
1. **ボス開幕ギミック**: トレーナー戦のエース登場初ターンは aura(自己バフ/guard) を必ず使用（movesにあれば）
2. 自己バフ: 自HP>70% かつ 該当statのstage<+2 → 40%で使用
3. guard: 自HP<40% かつ lastMove≠guard → 30%で使用
4. デバフ(foe): 相手が+ランク保有 or 自分より速い(spd系) → 30%
5. ちょうりつ: 相手が合計+3以上積んでいたら優先使用
6. それ以外は既存(相性×威力最大)。**charge技はHP>50%のときのみ選択**

## 8. バランス目標とシミュ仕様（Sonnet/S3）

- 同Lv同talent 1v1 平均決着ターン: **4〜6**（現状より+1〜2ターン=駆け引きの余地）
- バフ1回積んでから殴る戦略が「3ターン以上の戦闘で連打に勝る」こと（積み得だが過剰でない: +2上限が効く）
- 守護者初見勝率(推奨Lv・道具2個持込): **50-60%**、対策後(相性補完+バフ) 85%+
- シミュ: engineの純関数で「連打AI vs 積みAI vs ガードAI」総当たり×1000戦、タイプ全組合せの勝率行列を出力
- 逸脱時の調整ノブ: aura倍率(±2→±1)、guard係数(0.3→0.4)、recoil(0.25→0.33)、ボスtalent

## 9. 実装チェックリスト（Opus・この順で）

1. types.ts: Move/Combatant/TrainerData拡張（§1）
2. battleEngine.ts: stageMult・calcDamageへのランク/会心/bonusVsStatus/guard係数の組込み、effectiveSpeedのspdランク
3. moves.ts: TYPE_KIT 5枠化＋新12技（§5の表を逐語実装）＋learnset改訂(L10/L14/L18/L22)＋moveById
4. Battle.tsx: doMoveの正準シーケンス（§4）＝multi/recoil/drain/guard/charge/buffs/ちょうりつ、行動順のpriority対応、ランクリセット(交代/登場)、UIチップ(▲▼)・guard/充填表示、guard連続選択の無効化
5. maps.ts: 守護者ロードアウト（§6）適用
6. AI拡張（§7）
7. Sonnetへシミュ依頼（§8）→数値調整
- FXフック: 会心白フラッシュ/バフ上昇エフェクト等は`playMoveFx`側(パッケージB)に委譲。本specでは関数呼び出し箇所だけ用意

## 10. 非目標（やらないこと）

- 命中/回避ランク、天候、フィールド効果、2vs2、性格(乗算軸)＝別スペック、技マシン/技思い出し
- 既存セーブへの移行処理は不要（movesetはレベルから動的導出のため自動で新体系になる）
