# 実装指示書 O14: 戦闘V3「観るバトル、選ぶ捕獲」(Codex向け)

仕様の正: [SPEC_BATTLE_V3.md](SPEC_BATTLE_V3.md)（設計意図・受け入れ基準は§5）。本書は**コード上の統合点を実名で示す作業手順**。
規模目安: Battle.tsx +150〜250行 / Explore.tsx 小改修 / CSS少量。**新エンジン禁止**（既存関数の自動操縦のみ）。

---

## 0. 絶対に守る境界

1. **ダメージ計算・engine層(battleEngine.ts)・catchChance式は一切変更しない**（S3のバランス検証を無効化しないため）
2. 手動戦闘の操作フロー・見た目は無変更（オートは「上に足す」だけ）
3. ボス戦(trainer / nushi=forcedSpeciesId / 塔=config.tower)は**既定=手動**。雑魚(探索の通常wild)のみ既定=オート
4. `src/game/quickResolve.ts` は**探索から切り離す**（ファイル自体は将来の派遣調査用に残してよいが、Explore.tsxからのimport/使用を全廃）
5. FX・SE・捕獲演出(suck/shake/caught/break)は**1つも省略しない**

---

## 1. Battle.tsx — オートパイロット

### 1.1 モードと入口
- `Props` に `auto?: boolean` を追加（既定false）。`const [autoMode, setAutoMode] = useState(!!auto)`
- 画面上部（⏩速度ボタンの隣）に `🤖オート/✋手動` トグルを常設（ボス戦でもオートに切替可、ただし初期値はProps準拠）

### 1.2 自軍の技選択AI `choosePlayerMove(p: Combatant, e: Combatant): Move`
既存 `chooseEnemyMove`(L286) を参考に新設。**方針: シンプルに強い**
1. 溜め中(`p.charging`)は解放技を強制（chooseEnemyMoveと同じ処理を流用）
2. それ以外は**乱数を使わず**、`ownedMoveset`の攻撃技から `威力 × タイプ相性倍率(typechart) × (STAB 1.2)` の期待値最大を選ぶ
3. 攻撃技が無ければ先頭の技
- **乱数を使わない理由**: 塔(config.seed=シードラン)でオートを使っても乱数消費列が乱れない（SPEC_RNG_REPLAY §4の正準順序を壊さない）。判定分岐は状態から決定的に

### 1.3 自動ターン送り `useAutoPilot`
```
useEffect: autoMode && phase==='fighting' && !busy.current && !acting && !mustSwitch
           && !capturePrompt && !retreatPrompt のとき
  → const t = setTimeout(() => takeTurn(choosePlayerMove(playerC, enemy)), 420 / battleSpeed)
  → return () => clearTimeout(t)
依存: [autoMode, phase, acting, mustSwitch, capturePrompt, retreatPrompt, turnCount]
```
- `takeTurn`(L425)が敵ターンまで一括処理する既存構造をそのまま使う。busyガードも既存流用
- 割込みフラグ(下記§1.4/1.5)が立っている間はタイマーを起動しない

### 1.4 捕獲チャンス割込み（心臓部）
- state: `const [capturePrompt, setCapturePrompt] = useState(false)` と `const promptedRef = useRef(false)`
- 発火条件（autoMode かつ wild かつ 非塔 かつ phase==='fighting' の各ターン終了後に判定）:
  - `enemy.hp / enemy.maxHp <= 0.35`、または**未捕獲種**(`!state.caught.includes(enemy.data.id)`)・変異種・talent>=6 なら `<= 0.5`
  - 1戦闘1回のみ（promptedRef）。「さらに弱らせる」選択後はHPがさらに10pt%下がるか次ターン終了で再提示
- パネルUI（battle画面内オーバーレイ、既存 `.modal` 流用可）:
  - `🔮 フラスコを投げる — 成功率 {Math.round(catchChance(enemy)*100)}%`（フラスコ0個なら disabled+「フラスコがない」）
  - `⚔ さらに弱らせる — 成功率UP・倒してしまうリスク`（=パネルを閉じて1ターンだけオート続行→再提示）
  - `💨 とどめを刺す`（=パネルを閉じ、以後この戦闘では再提示しない）
- 「投げる」は**既存 `throwFlask()`(L677) をそのまま呼ぶ**（経済・演出・成功判定を一切複製しない）
- 手動モードでは出さない（従来どおり自分でフラスコボタンを押す）

### 1.5 撤退割込み
- `player.hp / player.maxHp <= 0.30` かつ autoMode で一時停止 → `[💨 撤退する(=既存の逃げる処理) / ⚔ 戦い続ける]`
- 1戦闘1回のみ。トレーナー/塔では出さない（逃走不可のため）

### 1.6 開封演出（揺れの色）
- 既存 capture 演出のshake中、対象が `talent>=6` なら金色、`mutant` なら虹色のグローを追加
- 実装: `.cap-shake` に `data-rarity="gold"|"rainbow"` を付与し battle-fx.css でfilter/ドロップシャドウ切替（**index.cssではなくbattle-fx.cssへ**）
- 手動戦闘の捕獲でも同様に発火してよい（共通コード）

### 1.7 NEW!バッジ
- 戦闘開始時、wild かつ `!state.caught.includes(enemy.data.id)` なら敵名の横に `NEW!` チップ表示（金色小バッジ）

### 1.8 速度
- `setBattleSpeed` の選択肢を 1x/2x/4x に（既存は1/2）。localStorageキーは現行 `ao-battle-speed` のまま

---

## 2. Explore.tsx — クイック決着の置換

1. `resolveQuickBattle` / `QuickBattleResult` / quickResultモーダルを**削除**
2. イベントパネルのボタンを差し替え:
   - battle/nushi系: `▶ オートで戦う`(主・=consume()でBattleへ、auto=true) / `✋ 手動で戦う`(副・auto=false)
   - trainer(守護者): `⚔ 挑む`のみ（手動固定・auto無し）
3. `onStartBattle(config)` に `auto` を伝える: App.tsx経由で `<Battle auto={...}>` に渡す（BattleConfigにautoを足すのでも、propsで別渡しでも可。**セーブに保存しない**こと）

## 3. App.tsx

- `<Battle ... auto={battleAuto} />` の配線（Exploreからの起動時のみtrue、塔/守護者はfalse）
- 計測(O1・analytics.track): `capture_panel{action}` / `capture_result{success, talent, mutant}` / `auto_battle_end{result, turns}`

## 4. 消すもの・触らないもの

| 対象 | 扱い |
|---|---|
| Explore内 quickResolve 使用・結果モーダル | 削除 |
| quickResolve.ts 本体 | 残置可（未参照になること。コメントで「派遣調査のオフライン解決候補」と明記） |
| 手動戦闘のUI/挙動 | 無変更 |
| battleEngine.ts / catchChance / ダメージ式 | **変更禁止** |
| 塔のシード乱数 | オートAIは乱数不使用で影響ゼロにする(§1.2) |

## 5. 動作確認チェックリスト（Codex自身がpreviewで）

- [ ] 探索→戦闘イベント→「オートで戦う」→無操作で戦闘が進む（スプライト/ダメージポップ/SEが出る）
- [ ] 敵HP減で捕獲パネルが出る・%表示・「投げる」で吸い込み→揺れ→結果までフル再生
- [ ] 「さらに弱らせる」→1ターン後に再提示、「とどめ」→以後出ない
- [ ] talent6+の敵で金色、変異種で虹色の揺れになる（demo_enemyフックはdevで使用可）
- [ ] フラスコ0個でパネルの投擲がdisabled
- [ ] 自HP30%以下で撤退パネル。撤退で探索に戻る
- [ ] 守護者戦・ヌシ・塔は手動で始まる（オートトグルで切替は可能）
- [ ] 塔でオートON→完走できる（乱数エラーなし）
- [ ] クイック決着ボタン/モーダルが探索から消えている
- [ ] `npm run build`（check_rng含む）通過
- [ ] 旧セーブ読込→戦闘1回→セーブ書き出しが正常

## 6. コミット分割の指定

1. `feat: Battle.tsx オートパイロット(auto/choosePlayerMove/速度4x)`
2. `feat: 捕獲チャンス・撤退割込み+開封演出(金/虹)+NEW!バッジ`
3. `feat: Exploreをオート戦闘に接続・クイック決着モーダル廃止`
の3分割でpush。各コミットでbuildが通ること。
