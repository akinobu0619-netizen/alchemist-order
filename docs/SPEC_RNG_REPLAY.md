# SPEC: シードRNG＆リプレイ検証プロトコル（F1）

策定: 2026-07 / 担当: Fable(設計)→Opus(実装=O3)→Sonnet(検証テスト=S3系)
目的: **「同じシード＋同じ入力＝同じ結果」を保証する決定論バトル基盤**を作る。
これは (1)週替わりシード塔=F2 の前提、(2)将来のサーバ権威スコア検証(F5/O10)の前提、
(3)バランスシミュの本実装共有(現状 scripts/sim_balance.mjs はロジックの複製でドリフトする)の3つを一度に解決する。
後付けが最も高くつく基盤なので、機能追加でBattle.tsxがさらに太る前に入れる。

## 0. 一文サマリ

全ゲームプレイ乱数を「シード付きストリーム」経由に統一し、プレイヤーの入力だけをログに記録する。
検証側は同じシード＋入力列でエンジンを再実行し、毎ターンのチェックサムが一致すればそのスコアは本物。

## 1. スコープ（v1）

- **対象: 試練の塔(スコアアタック)の全バトル**。ここだけが「他人と競う＝検証が要る」領域。
- 通常の野生戦/守護者戦/捕獲/talentロールは v1 では従来どおり非シード（`Math.random`可）。
  ただし乱数呼び出しは全て後述の `Rng` インターフェース経由に置き換え、既定実装を非シードにするだけにする
  （＝v2でフィールドにも決定論を広げるときコード変更ゼロで済む）。
- 演出専用の乱数はスコープ外のまま: audio.ts のノイズ生成、FXタイミング、ambient(既にハッシュ決定論)。

## 2. PRNGと シード導出

- **PRNG: mulberry32**（32bit・約10行・依存ゼロ・JSで十分高速。暗号強度は不要=検証はサーバ再シミュで担保）。
- **文字列→シード: cyrb128**（128bit状態を作り、mulberry32を4系統初期化 or 先頭32bitのみ使用）。
- 実装は `src/engine/rng.ts`（新規・純関数のみ・エンジン層に置く）。

```ts
// src/engine/rng.ts の公開I/F
export interface Rng {
  next(): number                 // [0,1) — Math.random互換
  int(lo: number, hi: number): number // 両端含む整数
  chance(p: number): boolean     // next() < p
  pick<T>(arr: readonly T[]): T
  fork(label: string): Rng       // 子ストリーム派生(下記§3)。親の消費位置に依存しない
}
export function makeRng(seed: string): Rng
export function systemRng(): Rng // Math.random委譲(非シード用の既定)
```

### シード階層（塔）

```
runSeed   = `AO1|tower|<開始時に生成したnonce>`          // 通常塔: 開始時にランダム生成しログへ記録
          = `AO1|wtower|<YYYY>-W<ISO週>`                 // 週替わり塔(F2): 全員共通
floorSeed = runSeed.fork(`floor:${floor}`)               // 階ごとの敵生成
battleRng = floorSeed.fork('battle')                     // そのバトル内の全乱数
```

- **fork はラベル文字列のハッシュで独立ストリームを作る**（親の消費数に影響されない）。
  これにより「敵生成の乱数を1個増やしたらバトル中の全乱数がズレる」事故を構造的に防ぐ。
- 週替わり塔でのリトライ: 同じ週＝同じシードなので、**同じ編成・同じ行動なら毎回同じ結果**。
  運の引き直し(luck-fishing)が原理的に無効になり、試行の価値が「行動の改善」だけになる。
  これは防御であると同時にゲーム性（パズル性）。仕様として明記し、F2の告知文言にも使う。

## 3. 乱数ストリームの分離（ドメイン）

| ストリーム | 用途 | v1 |
|---|---|---|
| `floor` | 階の敵種選択・(将来)出現順 | シード |
| `battle` | バトル内の全ロール(§4) | シード |
| `field` | 野生エンカ発生・レア枠・talentロール | 非シード(systemRng)。I/Fだけ通す |
| (なし) | 音・FX・ambient | 対象外。Math.random直呼び可はaudio.tsのみ許可 |

## 4. バトル内ロールの正準順序（draw order）

再現性はロールの**回数と順序**が固定であることに依存する。ターン解決は以下の正準順で、
必要なロールだけを `battleRng` から順に引く（引く/引かないの分岐自体は状態から決定的に定まること）。

1. 敵AI選択ロール `r`（chooseEnemyMove の閾値判定用・毎ターン1個固定で引く）
2. 行動順決定（priority→effectiveSpeed。乱数なし。同速はプレイヤー先攻=現仕様維持）
3. 先手側: preMoveCheck（こおり解け25% / まひ25%。**該当状態のときだけ**引く）
4. 先手側: 命中ロール
5. 先手側: multi回数ロール（multi技のみ）
6. 各ヒット: ダメージ乱数(0.85-1.0)→会心ロール（ヒット数ぶん）
7. 先手側: inflictロール / toxictouchロール（該当時のみ）→ ねむりターン数ロール（付与時のみ）
8. 後手側: 3〜7を同様に
9. ターン終了処理（やけど/どく/灰化ダメージ・regen。乱数なし）
10. （プレイヤーが捕獲を選んだターン: 捕獲ロール1個。塔では捕獲不可なのでv1は不使用）

現状 `preMoveCheck` はエンジン内でMath.random直呼び→ **シグネチャに `rng: Rng` を追加**。
`calcDamage` は既に `rand/critRand` 引数があるので呼び出し側で `battleRng` から渡す。

## 5. 行動ログ（リプレイの記録形式）

塔ラン1回につき1オブジェクト。localStorageに直近ランを保存、将来はこれをサーバへ提出(O10)。

```jsonc
{
  "v": 1,                          // ログフォーマット版
  "ruleset": "<rulesetHash>",      // §7。エンジン/データの版
  "seed": "AO1|tower|k3x9…",       // runSeed全文
  "party": [                        // 検証に必要な最小情報のみ(uid不使用)
    { "sp": "ignif", "lv": 20, "t": 3, "item": "powerband", "moves": ["fire_b","fire_r","fire_a","sig"] }
  ],
  "items": { "heal": 3, "heal2": 1 },
  "floors": [
    {
      "n": 1,
      "cmds": [                     // プレイヤー入力のみ。敵行動はシードから再導出
        { "a": "move", "i": 0 },   // 技index
        { "a": "item", "k": "heal" },
        { "a": "switch", "i": 2 }
      ],
      "ck": ["a3f21c", "9b02e7"]   // 毎ターン終了時のチェックサム(§6)
    }
  ],
  "result": { "reached": 7, "score": 7 }
}
```

- サイズ目安: 30階ラン≒2〜5KB。問題なし。
- `party` は種/Lv/talent/持ち物/技構成のみ。**個体uid・経験値は記録しない**（検証に不要）。

## 6. チェックサムと検証手順

- 毎ターン終了時: `ck = cyrb53(turnNo, pHp, eHp, p.status, e.status, stages…)` の下位24bit hex。
- **検証器** `scripts/verify_replay.mjs`（Sonnet運用・将来はサーバ関数に移植）:
  1. ログの ruleset が現行と一致するか確認（不一致は「検証不能」で棄却、改竄扱いにはしない）
  2. seed＋party からラン全体をヘッドレス再実行、cmds を順に適用
  3. 各ターンの ck を照合。**最初の不一致ターンを報告**（デバッグ容易性のため全turn記録）
  4. 全一致＋result一致 → VERIFIED
- 期待する使い方: 週替わり塔の自己ベスト提出（Phase 2はスクショ+ログ添付のハッシュタグ運営、Phase 3はAPI提出→サーバ再シミュ）。

## 7. rulesetHash（互換性管理）

```
rulesetHash = cyrb53( ENGINE_VERSION 定数 + monsters.json内容 + moves.tsの数値表 + typechart.json内容 )
```

- エンジン/技/種族値/相性のどれかを変えたら自動で別ハッシュ→古いログは「検証不能(版違い)」。
- 実装: ビルド時に算出して定数埋め込み（vite define）が理想だが、v1は手動バンプの `ENGINE_VERSION = 'ao-battle-1'` ＋データJSONの実行時ハッシュで可。
- 週替わり塔の週内バランス変更は原則禁止（週の途中でスコアの土台が変わるため）。やむを得ない場合は週を無効化。

## 8. 脅威モデル（何を防ぎ、何を防がないか）

| 攻撃 | 対策 | 備考 |
|---|---|---|
| セーブ改竄(莫大な金/道具) | 塔は**満タン開始＋道具持込数をログに記録**。partyのLv/talent分布に妥当性上限(実装はv2) | 完全防止はサーバ進行管理が要る=スコープ外 |
| スコア数値の直接改竄 | 再シミュで結果が再現しないため検出 | v1の主目的 |
| 改造クライアント(ダメージ式改変) | 再シミュ(正規エンジン)と ck が一致しない | 〃 |
| 運の引き直し(リセマラ) | 週シード固定＝同編成同行動は同結果。**編成替えは正当な攻略**として許容 | 防御でありゲーム性 |
| ログ自体の捏造(総当たりで正しいckを偽造) | ckはあくまで早期発見用。**正は再シミュ**なので捏造にはエンジン等価の実装が必要＝それはもう正当なプレイ | 割り切り |
| 自動化(bot) | 対象外。決定論下ではbotの発見した最適手順も人間が再現可能 | — |
| demo_enemy等のDEVフック | **シード付きラン中はDEVフックを全無効化**(実装必須) | O3チェックリストに含む |

## 9. 実装アーキテクチャ（O3の作業指針）

**核心: ターン解決ロジックをBattle.tsx(UI)からエンジン層へ抽出する。**
現状Battle.tsxのdoMove/enemyTurnにロジックとUI(ログ文字列/FX/sleep)が混在しており、このままでは再シミュ不能。
sim_balance.mjs がロジックを複製して既にドリフトリスクを抱えている——抽出後はシミュも本物のエンジンを使う。

```
src/engine/rng.ts          … §2 (新規・純関数)
src/engine/battleEngine.ts … 既存の純関数群(preMoveCheckにrng注入を追加)
src/engine/turnResolver.ts … 新規。resolveTurn(state, playerCmd, rng) => { nextState, events[] }
                              events = [{kind:'move',…},{kind:'damage', crit,…},{kind:'inflict',…}] の列
src/screens/Battle.tsx     … resolveTurnを呼び、events列を順に演出(ログ文/FX/効果音)するだけの層に縮退
scripts/verify_replay.mjs  … §6の検証器。turnResolverをそのままimport
scripts/sim_balance.mjs    … 複製ロジックを捨て turnResolver 利用に書き換え(ドリフト解消)
```

### 段階移行（一度にやらない）

- **α: rng.ts導入＋全Math.random置換**。塔=シード、他=systemRng。挙動不変を確認してコミット。
  lint規制: `no-restricted-properties`で `Math.random` を src/engine・src/game・src/screens/Battle.tsx・src/screens/Field.tsx で禁止（audio.tsのみ許可）。
- **β: turnResolver抽出**。Battle.tsxをevents描画に書き換え。ここが最大工数(実質Battle.tsxの書き直し)。
  受け入れ基準: 実機で従来と同一の見た目/文言/挙動＋tsc/回帰QA(S2)通過。
- **γ: ログ記録＋verify_replay.mjs**。受け入れ基準は§10。

## 10. 受け入れテスト（Sonnet/S3）

1. **決定論**: 同一シード＋同一cmdsで塔ランを2回ヘッドレス実行→全ターンck完全一致 ×1000ラン。
2. **再現**: 実機で塔を1ラン手動プレイ→保存されたログをverify_replay.mjsで検証→VERIFIED。
3. **改竄検出**: ログのresult.reachedを+1改竄→REJECT。partyのtalentを改竄→REJECT。
4. **独立性**: 敵生成ロジックに乱数消費を1個追加しても、fork分離によりバトル内ckが不変であること。
5. **回帰**: シード導入後の通常野生戦/守護者戦の挙動が従来と統計的に同一(§8のシミュ勝率が誤差内)。

## 11. 非目標（やらないこと）

- 暗号学的な耐改竄性（署名/難読化）。正はサーバ再シミュ、クライアントは常に信用しない前提。
- 通常フィールド進行(エンカ/捕獲/talent)の決定論化はv2以降。
- リプレイの**観戦再生UI**(他人のランを映像的に再生)は将来のO5系機能。ログ形式はそれに耐える設計だが実装しない。
- Battle.tsx演出の変更。βの縮退は「見た目同一」が条件。
