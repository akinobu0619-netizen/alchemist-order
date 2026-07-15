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

---

## 取り込み手順（既存 ART_ORDERS と共通）

1. 白背景PNG生成 → `scripts/remove_bg.py` で透過化（アイテム/アイコンは透過必須）
2. 256px正方（メニューアイコンは円構図でも出力は正方256でよい）
3. 該当パスへ配置しコミット&push
4. `ItemIcon`/各ローダーが存在確認して自動で画像へ切替（無ければ絵文字フォールバックのまま＝**部分的に届いても壊れない**）
5. 反映後 Opus が preview 実機確認

## 発注の進め方（推奨順）
**S（もちもの6）→ A（プレミアム2）→ D（メニュー8）** をまず出せば、現行UIの仮表示が一掃される。
**B（素材24）→ C（器4）** は O12 の先行投資。時間があるうちに作っておくと実装が絵待ちにならない。
E は任意・後回し可。
