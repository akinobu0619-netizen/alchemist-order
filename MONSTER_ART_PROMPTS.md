# 幻獣デザイン用 プロンプト集（ChatGPT 画像生成向け）

画風: **原案の細密イラスト調**（手描きインク＆水彩の幻獣図鑑）／構図: **単体・全身・背景透過**

## 使い方（推奨フロー）
1. ChatGPTの会話の最初に、下の **【マスター指示】** を貼る。可能なら **原案の幻獣一覧画像も添付**して「この画風に統一して」と伝える（統一感が段違いに上がる）。
2. あとは各幻獣の **被写体プロンプト**（英語1〜2文）を1体ずつ投げる。「同じ画風・背景透過PNG・正方形で」と都度添えると安定。
3. 出力を **`<id>.png`** という名前で保存し、`public/sprites/` に置く → ゲームに自動反映。
4. 進化系統（例: ignif→flamand→volcadon）は **同じ生き物が成長した姿**になるよう、前段の画像を参照に出すと連続性が出る。

---

## 【マスター指示】（最初に1回だけ貼る）

```
You are illustrating a Renaissance-era alchemical monster compendium ("錬金幻獣録").
Art style for ALL creatures, keep it perfectly consistent:
- Hand-painted ink-and-watercolor fantasy bestiary illustration, fine confident linework, soft natural shading.
- Muted, earthy, slightly aged palette (parchment-era tones) with rich but not neon color accents per element.
- Semi-realistic creature design with a touch of storybook charm; believable anatomy and texture.
- ONE single creature, full body, centered, clear readable silhouette, gentle 3/4 or side view.
- TRANSPARENT background (PNG, alpha). No background scenery, no text, no labels, no border, no frame, no shadow plate.
- Square 1:1 composition, high detail.
Render each creature I describe in exactly this style.
```

---

## 被写体プロンプト（全102体）

### 火 (Fire)
- `ignif.png` — **イグニフ**（火・進化1）: a small lively fire lizard, orange-red scales, a glowing ember flame on the tip of its tail.
- `flamand.png` — **フレアマンド**（火・進化2）: a larger salamander wreathed in living flames, a fiery crest along its back, fierce eyes.
- `volcadon.png` — **ヴォルカドン**（火・進化3）: a massive fire dragon with a small rocky volcano fused to its back, smoke and lava cracks across its hide, imposing.
- `emberio.png` — **エンバーリオ**（火・進化1）: a playful lion cub with a mane made of small flickering flames.
- `blazeroar.png` — **ブレイズロア**（火・進化2）: a young lion with a blazing mane and a flaming tail tuft.
- `ignisleo.png` — **イグニス・レオ**（火・進化3）: a regal beast-king lion engulfed in a great fiery mane, noble and powerful.
- `candle.png` — **キャンドル**（火/冥・進化1）: a living candle creature, soft wax body, a tiny ghostly face within its small flame.
- `lanternwisp.png` — **ランタン・ウィスプ**（火/冥・進化2）: a floating spectral lantern carried by a wispy spirit, eerie blue-orange flame.
- `hellflare.png` — **ヘルフレア**（火/冥・進化3）: a sinister will-o-the-wisp demon engulfed in purgatorial fire, skull-shaped flame core.

### 水 (Water)
- `aquab.png` — **アクアブ**（水・進化1）: a round translucent water-blob fish, cute, droplets clinging to its jelly-like body.
- `marinel.png` — **マリネル**（水・進化2）: a graceful mermaid-like creature with flowing fins and a shimmering fish tail.
- `leviaran.png` — **レヴィアラン**（水・進化3）: a colossal sea-serpent dragon, sleek blue scales, oceanic fins, regal and ancient.
- `teary.png` — **ティアリィ**（水/聖・進化1）: a tiny water sprite, a single living dewdrop with delicate translucent wings.
- `naiad.png` — **ナイアード**（水/聖・進化2）: a serene water maiden spirit, hair and gown of flowing water.
- `undine.png` — **ウンディーネ**（水/聖・進化3）: an elegant water elemental nymph, robes of cascading water, gently radiant.
- `shelk.png` — **シェルク**（水・進化1）: a small timid creature peeking out from a sturdy spiral shell.
- `coralga.png` — **コーラルガ**（水・進化2）: an armored crab-like creature plated with living coral.
- `krakent.png` — **クラーケント**（水・進化3）: a giant kraken sea-beast with many powerful tentacles, menacing deep-sea coloring.
- `frost.png` — **フロスト**（水・進化1）: a small icy cub made of packed snow with frosty blue accents.
- `glacia.png` — **グレイシア**（水・進化2）: a crystalline ice beast exhaling frost, sharp ice spines.
- `iceberg.png` — **アイスバーグ**（水・進化3）: a towering iceberg titan, jagged glacial body, cold and massive.

### 風 (Wind)
- `cogrif.png` — **コグリフ**（風・進化1）: a fluffy baby griffin, eagle head and wings with a small lion body.
- `sylfeed.png` — **シルフィード**（風・進化2）: a sleek winged beast wreathed in swirling wind, elegant feathers.
- `grandroc.png` — **グランドロク**（風・進化3）: an enormous roc bird with vast majestic wings that seem to cover the sky.
- `pibit.png` — **ピビット**（風・進化1）: a small round blue songbird, friendly.
- `skylark.png` — **スカイラーク**（風・進化2）: a graceful sky bird with long sweeping wings.
- `tempesta.png` — **テンペスタ**（風・進化3）: a fierce storm raptor trailing thunderclouds and gusting wind.
- `briezel.png` — **ブリーゼル**（風・進化1）: a small swift fox with windswept fur.
- `gailfox.png` — **ゲイルフォックス**（風・進化2）: a nine-tailed wind fox conjuring small whirlwinds.
- `zampu.png` — **ザンプウ**（風・進化3）: a majestic long-tailed wind-god fox, flowing tails like gusts.
- `wingly.png` — **ウィングリ**（風・進化1）: a tiny newly-hatched wyvern with oversized little wings.
- `skydrake.png` — **スカイドレイク**（風・進化2）: an agile young wyvern in flight.
- `stormwyvern.png` — **ストームワイバーン**（風・進化3）: a great storm wyvern with lightning-tinged wings.

### 地 (Earth)
- `falcone.png` — **ファルコーネ**（地・進化1）: a small sprouting plant creature, a seedling with two budding leaves and tiny eyes.
- `mandrago.png` — **マンドラゴ**（地・進化2）: a mandrake creature, a humanoid gnarled root with a leafy head, mouth open mid-scream.
- `alraune.png` — **アルラウネ**（地・進化3）: an alraune, a beautiful flower maiden emerging from a large blossom with trailing vines.
- `pebblin.png` — **ペブリン**（地・進化1）: a small creature formed of clustered pebbles and earth.
- `rockgolem.png` — **ロックゴーレム**（地・進化2）: a sturdy stone golem guardian, mossy rocky body.
- `titanrock.png` — **タイタンロック**（地・進化3）: a mountainous rock titan built of huge boulders, immense.
- `gnomy.png` — **グノーミィ**（地・進化1）: a little earth gnome with a red pointed cap, holding a tiny pickaxe.
- `earthgnome.png` — **アース・グノーム**（地・進化2）: an earth-sage gnome commanding soil, longer beard, robes.
- `gaialord.png` — **ガイア・ロード**（地・進化3）: a grand earth elder, a body of stone and living soil, lord of nature.
- `hobgobalt.png` — **ホブゴバルト**（地/毒・進化1）: a small green-skinned goblin, mischievous grin, crude little weapon.
- `ogrebalt.png` — **オーガバルト**（地/毒・進化2）: a hulking brutish ogre wielding a massive club.
- `tsunousa.png` — **ツノウサ**（地・進化1）: a wild rabbit with a single small crystal horn on its forehead.
- `hornrabi.png` — **ホーンラビ**（地・進化2）: a leaping rabbit with growing crystalline horns.
- `crystag.png` — **クリスタッグ**（地・進化3）: a noble forest stag with luminous crystal antlers, guardian aura.
- `ammo.png` — **アンモ**（地/錬成・進化1）: an ammonite fossil creature revived, a spiral ribbed shell with small tentacle eyes.
- `ankylos.png` — **アンキロス**（地/錬成・進化2）: an armored ankylosaur-like beast with iron plating and a heavy tail club.

### 雷 (Lightning)
- `sparki.png` — **スパーキ**（雷・進化1）: a small fuzzy creature crackling with static electricity.
- `boltmouse.png` — **ボルトムース**（雷・進化2）: an electric mouse with charged glowing cheeks.
- `zircondor.png` — **ジルコンドル**（雷・進化3）: a thunderbird condor crackling with arcs of lightning across its feathers.
- `latterune.png` — **ラッテ・ルーン**（雷・進化1）: a small mouse with faint glowing rune markings on its fur.
- `coinlatte.png` — **コイン・ラッテ**（雷・進化2）: a mouse clutching shiny gold coins, sparkly eyes.
- `mithrilrat.png` — **ミスリル・ラット**（雷・進化3）: a sleek rare rat sheathed in mithril, crackling with electricity.
- `jolty.png` — **ジョルティ**（雷・進化1）: a kitten with fur standing on end, tiny sparks around it.
- `elecat.png` — **エレキャット**（雷・進化2）: an electric cat with lightning-charged claws.
- `ligarv.png` — **ライガルヴ**（雷・進化3）: a fierce tiger-beast with lightning-wreathed fangs and mane.

### 毒 (Poison)
- `portabupa.png` — **ポルタ・ブーパ**（毒/風・進化1）: a small leaf-eating caterpillar larva, soft and round.
- `morpholucis.png` — **モルフォ・ルシス**（毒/風・進化2）: a brilliant blue morpho butterfly with shimmering iridescent wings.
- `prismapapillon.png` — **プリズマ・パピヨン**（毒/風・進化3）: a magnificent butterfly with rainbow prismatic wings, dusted with shining scales.
- `venomite.png` — **ヴェノマイト**（毒・進化1）: a small venomous insect with a sharp stinger.
- `toxeed.png` — **トキシード**（毒・進化2）: a toxic bug oozing and spraying venom.
- `pestilence.png` — **ペスティレンス**（毒・進化3）: an ominous plague-insect king, dark and dreadful.
- `sporin.png` — **スポアリン**（毒/地・進化1）: a small mushroom creature with a round cap and little legs.
- `myconid.png` — **マイコニド**（毒/地・進化2）: a fungal mushroom-person releasing spores.
- `deathcap.png` — **デスキャップ**（毒/地・進化3）: a deadly toxic mushroom lord shrouded in dark spores.

### 錬成 (Artificial / Alchemica)
- `slimeflask.png` — **スライム・フラスコ**（錬成/毒・進化1）: a gooey alchemical slime spilling from a glass laboratory flask.
- `amalgamhedoro.png` — **アマルガム・ヘドロ**（錬成/毒・進化2）: a metallic-toxic amalgam sludge absorbing scraps of material into itself.
- `chimeriaooze.png` — **キメリア・ウーズ**（錬成/毒・進化3）: a massive ooze with faint monster cores suspended inside it, the ultimate slime.
- `ghostarmor.png` — **ゴースト・アーマー**（錬成/冥・進化1）: an empty cursed suit of armor, hollow and animated, faint glow inside the helm.
- `dullahanknight.png` — **デュラハン・ナイト**（錬成/冥・進化2）: a headless knight holding its own helmeted head, dark armor.
- `blackpaladin.png` — **ブラック・パラディン**（錬成/冥・進化3）: a fallen dark paladin in ornate black armor radiating holy-and-dark energy.
- `coghomuncle.png` — **コグ・ホムンクル**（錬成・進化1）: a small clockwork homunculus automaton, brass gears, alchemical.
- `gearknight.png` — **ギア・ナイト**（錬成・進化2）: a gear-driven automaton soldier holding a blade.
- `clockworktitan.png` — **クロックワーク・タイタン**（錬成・進化3）: a giant clockwork war machine of interlocking gears, towering.
- `mimicris.png` — **ミミクリス**（錬成・単独）: a treasure-chest mimic with a toothy maw and a lolling tongue.

### 聖 (Light / Lumen)
- `florapixie.png` — **フローラ・ピクシー**（聖・進化1）: a tiny flower fairy with petal garments and delicate glowing wings.
- `titania.png` — **ティターニア**（聖・進化2）: a regal fairy queen, gentle radiance, ornate floral crown.
- `seraphim.png` — **セラフィム**（聖・進化3）: a six-winged seraph angel bathed in radiant holy light.
- `lumiel.png` — **ルミエル**（聖・進化1）: a small winged cherub of light, gentle and bright.
- `archange.png` — **アークエンジェ**（聖・進化2）: an archangel bearing a holy sword and a glowing halo.
- `chimeracub.png` — **キメラ・カブ**（聖・進化1）: a young chimera cub with subtle lion, goat, and snake traits, small and curious.
- `mysticchimera.png` — **ミスティック・キメラ**（聖・進化2）: a mystical three-headed chimera (lion, goat, serpent) with a magical aura.
- `celestialchimera.png` — **セレスティアル・キメラ**（聖・伝説・進化3）: a divine golden chimera with great radiant golden wings, majestic and holy.

### 冥 (Dark / Umbra)
- `nosferabat.png` — **ノスフェラバット**（冥・進化1）: a fanged vampire bat with leathery dark wings.
- `vamplord.png` — **ヴァンプ・ロード**（冥・進化2）: an aristocratic vampire noble in a high-collared cape.
- `noxdracul.png` — **ノクス・ドラクル**（冥・進化3）: an elder vampire progenitor wreathed in a swarm of bats, regal and dark.
- `bonekids.png` — **ボーンキッズ**（冥・進化1）: a small animated skeleton holding a little bone club.
- `skelknight.png` — **スケルナイト**（冥・進化2）: a skeletal knight wielding a rusty sword.
- `lich.png` — **リッチ**（冥・進化3）: an undead sorcerer lich in tattered robes, glowing eyes, necromantic aura.
- `shadowl.png` — **シャドウル**（冥・進化1）: a small formless shadow wraithling with glowing eyes.
- `wraith.png` — **レイス**（冥・進化2）: a vengeful ghost wraith trailing cold mist.
- `nightmare.png` — **ナイトメア**（冥・進化3）: a dark nightmare horse with a flaming mane and ember eyes.

### 伝説 (Legendary)
- `ignaros.png` — **イグナロス**（火・伝説）: a primordial fire beast, the very first flame given form, ancient and grand.
- `abystia.png` — **アビスティア**（水・伝説）: a primordial abyssal deep-sea beast, source of all water, vast and serene.
- `tempestroc.png` — **テンペスト・ロック**（風・伝説）: a primordial storm beast, embodiment of the first great tempest.
- `terrabehemoth.png` — **テラ・ベヒモス**（地・伝説）: a primordial earth behemoth, a continent-shaping colossus of stone.
- `sol.png` — **ソル**（聖・伝説）: a radiant solar beast, a creature embodying the sun, golden and blazing.
- `luna.png` — **ルナ**（冥・伝説）: a lunar beast embodying the moon, silver glow with an eclipse motif.

### ボス (Bosses)
- `magnus.png` — **灰王 マグヌス**（錬成・ボス）: a fallen genius alchemist as a humanoid boss, robed figure wreathed in grey ash and corrupted alchemical energy. (図鑑外)
- `abysschimera.png` — **アビス・キメラ**（冥/聖・最終ボス）: a forbidden chimera horror born from a corrupted philosopher's stone, fusing celestial gold and abyssal darkness, awe-inspiring and terrible. (図鑑外)
