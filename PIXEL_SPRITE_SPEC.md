# フィールド ドット絵 統一規格（16bit 昔風ピクセル）

**基準は既存の「森の番人 シルヴァ」= `public/ui/gym_forest.png`。** 全フィールドキャラ（プレイヤー／村人NPC／支部長）を**この絵柄に統一**する。
※対象は**フィールドの歩きキャラ（ドット絵）のみ**。バトル/図鑑の幻獣スプライトは従来の水彩のまま（混ぜない）。会話の立ち絵 `portraits/` は別管理（水彩のままでも、ドットに寄せてもよい）。

---

## 0. マスター・スタイル（各プロンプトの先頭に貼る）
```
STYLE — apply identically to EVERY field sprite:
16-bit era pixel art, SNES/GBA classic JRPG overworld character sprite.
Hand-pixeled, NOT smooth, NOT AI-glossy: chunky visible square pixels, hard edges, NO anti-aliasing,
NO soft gradients, NO blur. Limited retro palette (about 12-20 colors), simple dithering only where needed,
a clean 1px darker outline, flat cel shading with one light source from the upper-left.
Camera: 3/4 top-down oblique to match the tile map (slight downward tilt, not pure side, not pure top).
Proportions: 2.5-3 heads tall, slightly chibi, bold readable silhouette, feet at the bottom-center,
a small built-in oval shadow under the feet. Transparent background. Single character, full body, centered.
Match the look of the reference sprite (the forest guardian): same pixel size, outline weight, and muted storybook palette.
```

**解像度のコツ（AI生成時）**：論理サイズは小さく（**48〜64px相当**のドット感）。大きく生成した場合は**ニアレストネイバーで縮小**してギザギザを保つ（なめらかにしない）。書き出しは透過PNG、各コマ **64〜128px**。

**実装メモ（Codex）**：ドット絵をくっきり拡大表示するには、フィールドのキャラ画像に `image-rendering: pixelated`（`auto`/`high-quality`をやめる）。現状は非ドット前提で外しているため、ドット統一に合わせて**キャラ系imgだけpixelatedへ**戻すと締まる（タイル/水彩幻獣はそのまま）。

---

## 1. 歩行フレーム仕様（プレイヤー）
4方向 × 3コマ（0=直立 / 1=右足前 / 2=左足前）。`left`は`right`の左右反転で代用可。
ファイル例：`ui/player_<down|up|right>_<a|b>.png`（既存命名に合わせる）。
NPCは原則1コマ（向きは`down`相当の手前向き）で可。動かす場合のみ多コマ。

前文（プレイヤー各コマ）：
```
<STYLE> Pose: facing {toward viewer / away (back) / to the right}, {standing still / mid-stride right foot forward / left foot forward}.
Subject: a young alchemist apprentice in travel clothes and a short mantle, a round capture-flask on the belt, gender-neutral.
```

## 2. 村人NPC（ラピス村・拡充分＋既存）
前文（NPC共通）：
```
<STYLE> Single standing overworld NPC sprite, facing toward the viewer (front), one frame. Subject:
```
| ファイル | 名前 | Subject |
|---|---|---|
| `npc_peddler` | 行商人ドラン | a weathered traveling merchant, big bulging backpack, hooded travel cloak, walking staff, coin pouch |
| `npc_flowergirl` | 花売りのノラ | a cheerful little village girl holding a woven basket of colorful flowers, apron dress, short hair |
| `npc_scholar` | 司書エルマ | a calm scholarly woman, round glasses, long buttoned coat, a thick tome under one arm |
| `npc_oldwoman` | 老婆ハーゼル | a hunched kindly old woman, head shawl, knitted shawl, wooden cane |
| `npc_guard` | 門番ゴルド | a stout village guard, leather-and-brass armor, simple helmet, holding a spear |
| `npc_bard` | 吟遊詩人リコ | a slim bard, feathered cap, short cape, playing a fiddle (or lute) |
| `npc_mentor` | 師ガレン | an old master alchemist, long white beard, deep teal-green robe with brass clasps, wooden staff |
| `npc_mom` | 母リーゼ | a gentle middle-aged woman, chestnut hair tied with cloth, apron over a dress |
| `npc_inn` | 宿屋ボルガ | a portly cheerful innkeeper, vest and apron, holding a wooden mug |
| `npc_shop` | 道具屋ラル | a friendly merchant, leather apron, bandolier of potion vials, coin pouch |
| `npc_mirka` | 錬成師ミルカ | a young alchemist, brass goggles on forehead, rune-trimmed coat, glowing flask |
| `npc_morris` | 老人モーリス | a wizened old villager, hunched, plain clothes and shawl |
| `npc_tina` | 子供ティナ | an energetic little girl, short braids, simple dress |
| `npc_storage` | 預かり所の管理人 | a round friendly caretaker behind a counter look, apron, holding a ledger, crates motif |
| `npc_portal` | 転送門 | （キャラではなく装置）a glowing arcane warp gate: stone arch with swirling blue-violet portal energy, runes |

> 既存の `npc_mentor/mom/inn/shop/mirka/morris/tina` も**このピクセル規格で描き直して差し替え**（ファイル名据え置きで自動反映）。

## 3. 支部長・主要キャラ（同規格で順次）
`ui/gym_forest`（=基準・済）に合わせて、`gym_port`(マレア) ほか支部長8、ライバル カイト、ラスボス等もフィールド用は同じ16bitドットで。容姿は `CHARACTERS.md` 準拠。

---

## 4. 当面の優先
1. 村人6人（peddler/flowergirl/scholar/oldwoman/guard/bard）＝今回ゲームに追加済み（今は絵文字表示）→ ドットを置けば反映
2. プレイヤー4方向＝既存があれば16bitへ統一
3. 既存村人NPC（mentor/mom/inn/shop/mirka/morris/tina）の描き直し
4. 転送門の装置ドット（`npc_portal`）／預かり所（`npc_storage`）
5. （Codex）キャラimgの `image-rendering: pixelated` 復帰
