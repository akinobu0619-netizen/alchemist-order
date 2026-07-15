# Codex画像発注書 — アイテム／マップ／メニュー（2026-07・第2弾）

Fable/Opusからの一括発注。既存 `ART_ORDERS_2026-07.md`（火山・タイル）の続き。
**各素材の先頭に必ず `ART_SPEC_AND_PROMPTS.md` §0の統一規格を貼ること**（水彩絵本調・上左光源）。
ただしアイテムアイコンだけは俯瞰でなく**正面〜やや俯瞰の「図鑑の挿絵」構図**でよい（下記§0-item参照）。

現状棚卸し（2026-07-15時点）:
- 既存アイテム画像 = `item_flask/heal/heal2/money` の**4点のみ**
- もちもの6種・プレミアム素材2種・素材錬成24種・メニュー/施設アイコン = **全て未生成**（絵文字/テキスト仮）

## 0-item. アイテムアイコン共通仕様（重要）

```
ART STYLE (item variant):
Hand-painted ink-and-watercolor storybook illustration of a SINGLE alchemy item,
centered, front view slightly tilted, single soft light from upper-left, gentle shadow lower-right.
Muted warm storybook palette, soft painterly washes, fine ink accents, NO harsh outlines, NO cel-shading, NO pixel art.
TRANSPARENT background (白背景で出力→ scripts/remove_bg.py で透過化).
Square canvas, the item fills ~70% of the frame, 256x256.
No text, no frame, no UI, no hand holding it.
```
- 保存先の命名は**厳守**（コードの `ItemIcon kind=...` が `public/ui/item_<kind>.png` を自動ロード。無ければ絵文字にフォールバックするので、置いた瞬間に反映される）
- 透過必須。タイル/背景と違い影は内蔵の薄い楕円のみ

---

## 優先S: もちもの6種（今すぐUIに効く・実装済み機能）

装備システムは稼働中だが現在テキストのみ。アイコンがあると「もちもの」画面が一気にゲームらしくなる。
保存先 `public/ui/item_<id>.png`（例 `item_powerband.png`）。

| # | ファイル(kind) | 名称 | Subject（英プロンプトの主語部） |
|---|---|---|---|
| S1 | `item_powerband` | 力のハチマキ | a red martial-arts headband with a small metal emblem, faint aura of strength |
| S2 | `item_magicstone` | 魔石 | a polished violet arcane gemstone glowing faintly, set in a tiny brass mount |
| S3 | `item_lifering` | 命の輪 | a golden ring wreathed with a small green leaf-and-vine motif, warm glow |
| S4 | `item_swiftboots` | 俊足のブーツ | a pair of light leather boots with small feathered wings at the ankles |
| S5 | `item_guardamulet` | 守りの護符 | a round bronze amulet with an engraved shield rune, soft protective sheen |
| S6 | `item_oranberry` | 回復の実 | a plump blue-green berry with a glossy skin and a single leaf, dewy |

**Opus側の残作業（発注とは別）**: Home「もちもの」のselectドロップダウン横に `<ItemIcon kind={id}/>` を出す小改修。画像が来たら対応。

## 優先A: プレミアム錬成素材2種（錬成画面で使用中・現在アイコン無し）

保存先 `public/ui/item_<kind>.png`。

| # | ファイル(kind) | 名称 | Subject |
|---|---|---|---|
| A1 | `item_talentStone` | 才能石 | a faceted rainbow-opal crystal shard radiating a soft prismatic shimmer |
| A2 | `item_slotCharm` | スロットの護符 | a small ornate charm shaped like an open lantern-slot, brass and blue enamel |

## 優先B: 素材錬成アイテム24種（次期大型UPDATE O12・先行生成）

`SPEC_ITEM_ALCHEMY.md` の素材経済用。8タイプ×3品位。**先に一気に作っておく価値が最も高いバッチ**（実装時に絵待ちにならない）。
保存先 `public/ui/item_mat_<type>_<grade>.png`（例 `item_mat_fire_prime.png`）。type=英小文字, grade=common/fine/prime。

**品位の描き分け（全タイプ共通ルール）**:
- **common(並)**: 原石の欠片。くすんだ・素朴。小さめ・光沢弱
- **fine(良)**: 結晶化。面が整い淡く発光。装飾なし
- **prime(極)**: 「原初の〜」。核が強く発光＋微粒子が舞う・格の高い一点物

| type | 色調 | 並(common) | 良(fine) | 極(prime) |
|---|---|---|---|---|
| fire (火) | 赤橙 | 熾火の欠片 | 劫火の結晶 | 原初の火種 |
| water (水) | 青藍 | 雫の欠片 | 深海の結晶 | 原初の水滴 |
| wind (風) | 翠緑 | 疾風の羽片 | 旋風の結晶 | 原初の息吹 |
| earth (地) | 土褐 | 岩塊の欠片 | 大地の結晶 | 原初の礎石 |
| thunder (雷) | 黄紫 | 火花の欠片 | 雷鳴の結晶 | 原初の雷芯 |
| poison (毒) | 毒紫緑 | 毒沼の欠片 | 猛毒の結晶 | 原初の瘴気 |
| holy (聖) | 金白 | 聖光の欠片 | 神聖の結晶 | 原初の聖火 |
| dark (冥) | 紫黒 | 深闇の欠片 | 冥界の結晶 | 原初の虚無 |

各セルの Subject 雛形（type色とgrade段階を差し込む）:
```
common: a small rough {色調} raw mineral shard, dull, humble, faint tint
fine:   a cut glowing {色調} crystal, clean facets, soft inner light
prime:  a radiant one-of-a-kind {色調} primordial essence-core, strong inner glow with drifting motes, majestic
```
※24点は多いので**タイプ単位（3点セット）で生成→並べて品位差が一目で分かるか確認**しながら進めると破綻しない。

## 優先C: 錬成の器4種（O12・生成値0-3の見た目差）

`SPEC_ITEM_ALCHEMY` の「器」。素材錬成の触媒。保存先 `public/ui/item_vessel_<tier>.png`。

| # | ファイル(kind) | tier | Subject |
|---|---|---|---|
| C1 | `item_vessel_standard` | 標準(0) | a plain round glass alchemy flask, empty, cork stopper |
| C2 | `item_vessel_reinforced` | 強化(1) | a brass-banded reinforced glass flask, sturdier |
| C3 | `item_vessel_golden` | 黄金(2) | an ornate golden flask with filigree, faint warm glow |
| C4 | `item_vessel_special` | 特別(3) | a crystalline star-shaped vessel swirling with rainbow ether |

## 優先D: メニュー／施設アイコン（現在すべて絵文字の仮画像）

メニュー・ワールド・施設は現状 📖🗼⚗️🌲🌊🌋 等の絵文字。統一水彩の丸アイコンにすると格が上がる。
**優先度は中**（絵文字でも機能する）。保存先 `public/ui/menu_<key>.png`、円形・64〜96px相当・透過。

| # | ファイル(kind) | 用途 | Subject |
|---|---|---|---|
| D1 | `menu_dex` | 幻獣図鑑 | an open illustrated bestiary book with a glowing creature sketch |
| D2 | `menu_party` | 手持ち/編成 | three small creature silhouettes on a warm banner crest |
| D3 | `menu_bag` | どうぐ | a worn leather adventurer's pouch with vials peeking out |
| D4 | `menu_fusion` | 錬成釜 | a bubbling alchemy cauldron with a rune ring, violet residue |
| D5 | `menu_tower` | 試練の塔 | a tall spiral stone tower against a small moon |
| D6 | `menu_alchemy` | 素材錬成(O12) | a magic circle turning glowing shards into a small creature egg |
| D7 | `menu_expedition` | 派遣調査(O12) | a small backpack and map with a compass, "away on a journey" feel |
| D8 | `menu_gift` | 師匠の小包(ログボ) | a wrapped brown-paper parcel tied with twine and a wax seal |

## 優先E: マップ未実装・仮流用の格上げ（優先度低・任意）

現状は既存NPCドットで代用中。専用があれば火山郷の世界観が締まる。保存先は既存NPC規格 `public/ui/npc_<id>.png`（§1のマップスプライト仕様＝3方向×歩行）。

| # | id | Subject（村人規格） |
|---|---|---|
| E1 | `npc_blacksmith` | a burly volcano-town blacksmith, leather apron, soot-smudged, holding a hammer |
| E2 | `npc_hotspring` | an old bathhouse keeper granny of the volcano town, towel over shoulder, kindly |
| E3 | `npc_miner` | a rugged ore miner with a helmet lamp and a pickaxe |

※将来の「素材錬成所」を火山郷 or 本拠地にマップ設置する場合、建物スプライト `ui/building_alchemylab.png`（既存 building_* 規格）を1点追加発注する。O12実装が確定してから。

## 優先F: 記章8種（gym badge・コレクションの看板）★高価値

メニューの「獲得記章 n/8」は現在 🎖絵文字＋テキストのみ。ポケモンのバッジケース相当の**収集の誇り**が出る一等地。
各記章は**属性テーマの丸or盾型エンブレム**（水彩・金縁・中央に象徴モチーフ）。保存先 `public/ui/badge_<slug>.png`・256×256・透過。
現在は3つ実装(新緑/蒼潮/烈火)、残り5つは第4世界以降の予約。**先に8つ揃えて未取得はCSSグレースケール表示**にすれば「あと5枠」の収集意欲を可視化できる。

| # | slug | 記章名 | 世界/守護者 | 属性・色 | 中央モチーフ Subject |
|---|---|---|---|---|---|
| F1 | `badge_verdant` | 新緑の記章 | 緑霧の森/シルヴァ | 草地・翠緑 | a leaf-and-vine crest on an emerald shield |
| F2 | `badge_tide` | 蒼潮の記章 | 潮鳴りの海/マレア | 水・蒼藍 | a cresting wave drop on a sapphire shield |
| F3 | `badge_blaze` | 烈火の記章 | 紅蓮の火山郷/イグナート | 火・赤橙 | a rising flame on a ruby-red shield |
| F4 | `badge_spark` | 迅雷の記章 | (予約)雷/gym_volt | 雷・黄紫 | a jagged lightning bolt on an amber shield |
| F5 | `badge_gale` | 蒼嵐の記章 | (予約)風・嵐嶺/gym_peak | 風・翠白 | a swirling wind gust on a pale-teal shield |
| F6 | `badge_astral` | 聖光の記章 | (予約)聖/gym_astra | 聖・金白 | a radiant star-sun on a white-gold shield |
| F7 | `badge_umbra` | 玄冥の記章 | (予約)冥/gym_tomb | 冥・紫黒 | a crescent-eclipse on a dark-violet shield |
| F8 | `badge_forge` | 錬鉄の記章 | (予約)錬成・工房/gym_works | 錬成・鋼灰 | a hammer-and-gear on a steel-grey shield |

**共通スタイル**（アイテム変種§0-itemを踏襲しつつ）: emblem/badge、正面、金の縁取りリング、中央に上記モチーフ、属性色を基調にした水彩。8つで**形状・金縁・サイズを完全統一**（バラつくと安っぽくなる）。透過必須。

## 優先G: 実績メダル7種（達成の記録）

「実績」欄は現在 🏅達成/✨受取可/🔒未達 の絵文字。達成済みだけ専用メダルにすると記録の重みが出る。
保存先 `public/ui/medal_<id>.png`・256×256・透過。**未達/未受取はCSSグレースケール＋暗転で兼用**（ロック用の別画像は不要）。

| # | id(kind) | 実績名 | メダル Subject |
|---|---|---|---|
| G1 | `medal_first_win` | はじめての勝利 | a bronze medal with crossed-swords emblem, ribbon |
| G2 | `medal_catch_5` | コレクター見習い | a bronze medal with a small capture-flask emblem |
| G3 | `medal_catch_15` | コレクター | a silver medal with three creature silhouettes |
| G4 | `medal_badge_1` | 最初の記章 | a silver medal framing a tiny gym-badge shield |
| G5 | `medal_rich` | 小金持ち | a gold medal with a coin-stack emblem |
| G6 | `medal_wins_20` | 歴戦の錬獣師 | a gold laurel-wreath medal with a "XX" battle emblem |
| G7 | `medal_party_3` | にぎやかな旅 | a bronze medal with three linked companion icons |
| G0(任意) | `medal_locked` | 未達共通(任意) | a blank slate medal, dim, question-mark engraving |

**共通スタイル**: 円形メダル＋リボン、金属感（bronze/silver/goldで達成の格を段階表現）、水彩・金縁、透過。7つで**円径・リボン形状を統一**。

**Opus側の連動作業（発注とは別・画像到着後）**:
- 記章: `badges`はJP文字列保存なので **名前→slug対応表**を追加（例 `'新緑の記章'→'badge_verdant'`）。記章一覧を8枠グリッド化し、未取得は `filter: grayscale(1) opacity(.4)` でシルエット表示
- 実績: `item-ico`の絵文字を `<img src=medal_<id>.png>` に。未達は同グレースケール。`medal_locked` があれば未達に使う
- どちらも画像が無ければ現行の絵文字にフォールバックする実装にして**段階到着で壊れない**ようにする

---

## 取り込み手順（既存 ART_ORDERS と共通）

1. 白背景PNG生成 → `scripts/remove_bg.py` で透過化（アイテム/アイコンは透過必須）
2. 256px正方（メニューアイコンは円構図でも出力は正方256でよい）
3. 該当パスへ配置しコミット&push
4. `ItemIcon`/各ローダーが存在確認して自動で画像へ切替（無ければ絵文字フォールバックのまま＝**部分的に届いても壊れない**）
5. 反映後 Opus が preview 実機確認

## 発注の進め方（推奨順）
**S（もちもの6）→ A（プレミアム2）→ D（メニュー8）** をまず出せば、現行UIの仮表示が一掃される。【済】
**F（記章8）→ G（実績メダル7）** は収集の看板。メニューの「達成感」を最も上げる。今回の追加分。
**B（素材24）→ C（器4）** は O12 の先行投資。時間があるうちに作っておくと実装が絵待ちにならない。
E は任意・後回し可。
