// 幻獣を300種まで決定論的に生成。各進化系統に「アーキタイプ(原型)」を割り当て、
// 名前・図鑑文を概念ベースで付与し、dex 101-300 の詳細プロンプトを MONSTER_ART_PROMPTS_300.md に出力。
// 既存 dex(1-100) と bosses は保持。再実行しても同じ結果。
import { readFileSync, writeFileSync } from 'node:fs'

const dataPath = new URL('../data/monsters.json', import.meta.url)
const promptPath = new URL('../MONSTER_ART_PROMPTS_300.md', import.meta.url)
const data = JSON.parse(readFileSync(dataPath, 'utf8'))
const base = data.dex.filter((d) => d.dex <= 100)

const TYPES = ['火', '水', '風', '地', '雷', '毒', '聖', '冥', '錬成']
const TYPE_EN = { 火: 'fire', 水: 'water', 風: 'wind', 地: 'earth', 雷: 'lightning', 毒: 'poison', 聖: 'holy/light', 冥: 'dark/death', 錬成: 'alchemical/metallic' }

// アーキタイプ: [名前ルート(カナ), 和文概念, 英語ビジュアル概念, 配色]
const ARCH = {
  火: [
    ['サラマ', '溶けた皮膚を持つ火のサラマンダー', 'a fire salamander lizard with molten, lava-cracked skin and dripping embers', 'crimson and orange with glowing magma veins'],
    ['フェニ', '炎の羽をまとう不死鳥', 'a phoenix bird whose feathers are living flame, trailing sparks', 'gold and scarlet with ember sparks'],
    ['ドラグ', '燻る鱗の西洋火竜', 'a western fire dragon with smoldering dark scales, curved horns and tattered wings', 'deep red scales with orange inner glow'],
    ['イフリ', '煙の体躯の炎魔イフリート', 'an ifrit fire genie with a smoke-and-flame body, burning eyes and ember crown', 'charcoal body with molten orange flame'],
    ['ケルベ', '炎をまとう双頭の地獄犬', 'a two-headed hellhound wreathed in fire, ember drool, spiked collar of bone', 'black fur with a fiery mane'],
    ['マグマ', '黒曜と溶岩の巨人ゴーレム', 'a magma golem built of cracked obsidian plates with glowing lava seams', 'black rock with bright lava cracks'],
    ['ヒダマ', '顔のある鬼火・火の玉(UMA)', 'a will-o-wisp fire spirit, a floating orb of flame with a faint ghostly face', 'blue-white core fading to orange flame'],
    ['カエン', '鱗と炎たてがみの火麒麟', 'a flaming qilin (eastern holy beast) with scaled deer-like body and fiery mane', 'gold and vermilion'],
    ['エンコ', '炎の尾を持つ火狐', 'a fox monster with multiple flame-tipped tails and ember-lit fur', 'russet fur with glowing ember tips'],
    ['ヴォルケ', '噴煙を上げる火山甲獣(恐竜的)', 'a volcanic horned saurian beast with a smoking, rocky carapace and ember eyes', 'obsidian hide with glowing red fissures'],
    ['プロミ', '純粋な炎の精霊(オリジナル)', 'an abstract fire elemental, a sleek humanoid silhouette of pure swirling flame', 'yellow-to-orange gradient flame'],
    ['バーン', '残り火を吐く翼なき火ドレイク', 'a wingless fire drake with a serpentine body breathing glowing embers', 'burnt orange and ash grey'],
  ],
  水: [
    ['アクア', '透明な体の水スライム魚', 'a translucent water-jelly fish-slime with a glowing aqueous core', 'aqua blue, transparent and dewy'],
    ['レヴィ', '大海蛇(シーサーペント)', 'a great sea serpent leviathan with iridescent scales and fins', 'deep teal and sapphire scales'],
    ['クラケ', '深海の大蛸クラーケン(UMA)', 'a deep-sea kraken with massive suckered tentacles and a barnacled head', 'dark indigo with bioluminescent spots'],
    ['セイレ', '歌う半魚の海妖セイレーン', 'a siren sea-fae with fish-tail, fin-ears and flowing watery hair (non-human face)', 'pale cyan and pearl'],
    ['フロス', '万年雪の氷獣', 'an ice beast of packed snow and crystalline frost, frozen breath', 'white and pale ice-blue'],
    ['ウンデ', '水の四大精霊ウンディーネ', 'an undine water spirit, an elegant figure of flowing clear water and droplets', 'clear blue with white highlights'],
    ['ミズチ', '和の蛟(みずち)・水龍', 'a Japanese water dragon (mizuchi) with whiskered serpent body coiling in waves', 'jade green and river-blue'],
    ['コーラ', '珊瑚の鎧の甲殻獣', 'a crustacean beast clad in living coral armor with pincers', 'coral pink and sea green'],
    ['カッパ', '皿を持つ河童(UMA/妖怪)', 'a kappa river-imp with a turtle shell, webbed limbs and a water dish on its head', 'mossy green and pond-blue'],
    ['アンコ', '提灯を持つ深海の鮟鱇獣', 'a deep-sea anglerfish monster with a glowing lure and needle teeth', 'black body with a glowing blue lure'],
    ['ティア', '一滴から生まれた水妖精(オリジナル)', 'a tiny water sprite born from a single droplet, dew-winged and shimmering', 'crystalline blue, dewy'],
    ['シャチ', '氷海の鯱(オルカ)獣', 'an orca-whale beast of the frozen seas with frost-rimed fins', 'black and white with icy sheen'],
  ],
  風: [
    ['グリフ', '鷲と獅子のグリフォン', 'a griffon with eagle head and wings and a lion body, wind-ruffled feathers', 'tawny gold and sky white'],
    ['ロック', '空を覆う巨鳥ロック(伝説)', 'a colossal roc bird with vast feathered wings stirring storm winds', 'slate grey and storm white'],
    ['シルフ', '風の精霊シルフィード', 'a sylph wind spirit, a slender airy figure trailing ribbons of breeze', 'pale green-white, translucent'],
    ['ハーピ', '翼を持つ鳥女ハーピー(非人面)', 'a harpy with great feathered wings and taloned legs (avian, non-human face)', 'wind grey and cream'],
    ['ドラゴ', '東洋の風龍(細長い体)', 'an eastern wind dragon, long serpentine body riding the clouds, antlered', 'jade and cloud white'],
    ['カゼフ', '九尾の旋風狐', 'a gale fox with nine swirling wind-blown tails and keen eyes', 'silver-grey fur, wind streaks'],
    ['テング', '羽団扇の天狗(妖怪)', 'a tengu wind goblin with crow wings, a feather fan and a long-nosed mask', 'crimson and black feathers'],
    ['ワイヴ', '一対脚の飛竜ワイバーン', 'a wyvern with two legs and large bat-like wings, a barbed tail', 'teal and slate scales'],
    ['ツバメ', '嵐を呼ぶ猛禽(隼)', 'a falcon-raptor that summons storms, swept-back wings and sharp crest', 'steel blue and white'],
    ['モスマ', '光る目の蛾人モスマン(UMA)', 'a mothman cryptid with huge moth wings and glowing eyes', 'dusky grey with glowing red eyes'],
    ['ゼフィ', '微風そのものの精霊(オリジナル)', 'an abstract wind elemental, a coiling vortex of air given a graceful form', 'translucent white and pale cyan'],
    ['ペガサ', '翼ある天馬ペガサス', 'a winged pegasus horse galloping on the wind, flowing mane', 'white with silver wings'],
  ],
  地: [
    ['ベヒモ', '大地の巨獣ベヒモス', 'a behemoth, a colossal armored quadruped beast of stone-like hide', 'earthen brown and grey'],
    ['ゴーレ', '岩石のゴーレム', 'a rock golem of stacked boulders and moss, glowing rune core', 'grey stone with green moss'],
    ['ドリュ', '甲冑竜(恐竜・アンキロ系)', 'an armored dinosaur (ankylosaur-like) with bony plates and a club tail', 'olive and tan with bony armor'],
    ['トリケ', '三本角の角竜(トリケラトプス系)', 'a three-horned ceratopsian dinosaur with a broad frill', 'earth-red and ochre'],
    ['モール', '巨大土竜(もぐら)獣', 'a giant mole beast with huge digging claws and a star-nose', 'brown fur, pink claws'],
    ['ノーム', '土の精霊ノーム', 'a gnome earth spirit, a stout figure of soil, root and gemstone', 'soil brown with gem flecks'],
    ['ガーゴ', '石像の魔獣ガーゴイル', 'a gargoyle stone beast with bat wings and a fierce carved face', 'weathered grey granite'],
    ['サイクロ', '一つ目の巨人サイクロプス', 'a one-eyed cyclops giant of earth and rubble, club in hand', 'clay grey, single large eye'],
    ['アルマ', '球に丸まる鱗獣(アルマジロ)', 'an armadillo-like scaled beast that rolls into a boulder', 'bronze scales'],
    ['ペトラ', '岩亀(巨大な甲羅)', 'a giant tortoise whose shell is a craggy mountain with trees', 'mossy stone shell'],
    ['テラ', '結晶を抱く大地の精霊(オリジナル)', 'an abstract earth elemental, a humanoid of floating rock plates and crystal', 'sandstone with amber crystals'],
    ['ミミズ', '砂を泳ぐ大蟲(サンドワーム/UMA)', 'a giant sandworm with a ringed maw, burrowing through dunes', 'sandy tan, segmented'],
  ],
  雷: [
    ['ライリ', '雷光の麒麟(霊獣)', 'a thunder qilin with crackling mane and lightning-etched scales', 'electric yellow and white'],
    ['サンダ', '嵐を呼ぶ雷鳥サンダーバード(UMA)', 'a thunderbird with vast wings sparking lightning between feathers', 'storm blue with golden sparks'],
    ['エレキ', '帯電するウナギ電気魚', 'an electric eel-beast coiled with arcing current and glowing nodes', 'navy with neon yellow stripes'],
    ['ボルト', '稲妻状の角を持つ雷竜', 'a lightning dragon with jagged bolt-shaped horns and sparking scales', 'indigo scales, yellow arcs'],
    ['ガルヴ', '電磁の鋼狼', 'a steel wolf charged with electromagnetism, fur standing in sparks', 'gunmetal grey, blue arcs'],
    ['プラズ', 'プラズマ球の精霊(オリジナル)', 'an abstract plasma elemental, a sphere of crackling arcs with limbs of light', 'white-violet plasma'],
    ['イナズ', '雷雲を背負う獣', 'a beast carrying a small thundercloud, fur raised by static', 'charcoal cloud, yellow bolts'],
    ['デンジ', '磁力を操る甲虫', 'a magnetic beetle with horseshoe-magnet horns and sparking shell', 'red and silver, blue sparks'],
    ['ライガ', '電光をまとう雷虎', 'a lightning tiger with bolt-patterned stripes and glowing claws', 'gold and black, electric blue'],
    ['ヴォルテ', '球電をまとう浮遊獣(UMA・ボールライトニング)', 'a floating creature wrapped in ball-lightning, wide curious eyes', 'pale blue glow with white arcs'],
    ['ライデ', '太鼓を背負う雷神獣(雷神)', 'a thunder-god beast with a ring of taiko drums on its back, horned', 'crimson skin, golden ring'],
    ['スパー', '火花を散らす小竜', 'a small spark drakeling shedding tiny lightning sparks, big eyes', 'yellow with white belly'],
  ],
  毒: [
    ['ヴェノ', '猛毒の牙を持つ毒蛇', 'a venomous serpent with dripping fangs and a hooded neck', 'sickly green and purple'],
    ['ヒドラ', '多頭の毒龍ヒドラ(伝説)', 'a multi-headed hydra dragon spitting toxic mist from each maw', 'swamp green and violet'],
    ['パピヨ', '鱗粉を撒く毒蝶', 'a poison butterfly-moth spreading luminous toxic scales', 'magenta and acid green'],
    ['ヘドロ', '汚泥のスライム魔物', 'a sludge slime monster of bubbling toxic ooze with glowing eyes', 'murky purple-green ooze'],
    ['ドクガ', '棘だらけの毒蜘蛛', 'a venomous spider with barbed legs and a glowing toxin sac', 'black and toxic yellow'],
    ['バジリ', '石化の視線の毒蛇王バジリスク(伝説)', 'a basilisk, a crowned serpent-lizard whose gaze petrifies, venom drool', 'olive scales with a bone crown'],
    ['マンド', '叫ぶ毒草マンドラゴラ', 'a mandragora plant-beast with a screaming root-body and toxic leaves', 'earthy green with violet flowers'],
    ['スポア', '胞子を撒くキノコ獣', 'a fungal mushroom beast releasing toxic spore clouds, many caps', 'purple caps with green spores'],
    ['ミアズ', '瘴気の幽鬼(オリジナル)', 'an abstract miasma wraith, a cloud of poison gas with hollow eyes', 'sickly green vapor'],
    ['コカト', '鶏蛇コカトリス(伝説)', 'a cockatrice with a rooster head, dragon wings and a serpent tail', 'green and dull gold feathers'],
    ['サソリ', '毒尾の大蠍', 'a giant scorpion with a dripping venom stinger and heavy claws', 'deep purple chitin'],
    ['トキシ', '毒霧をまとう蛙獣', 'a poison dart frog beast with glowing toxic skin patterns', 'electric blue and black'],
  ],
  聖: [
    ['セラフ', '六枚翼の熾天使セラフ(非人)', 'a seraph, a radiant six-winged celestial being of light (abstract, non-human face)', 'white and gold with halo light'],
    ['ユニコ', '聖なる角の一角獣ユニコーン', 'a unicorn with a luminous spiral horn and a flowing mane', 'pearl white with golden horn'],
    ['ルミナ', '光をまとう聖獣麒麟', 'a holy light qilin radiating gentle dawn-light from its scaled body', 'ivory and soft gold'],
    ['グリフォ', '聖鳥グリフォン(光属性)', 'a holy griffin with sunlit golden feathers and a noble crest', 'gold and white'],
    ['エンジェ', '剣と光輪の守護天使(非人)', 'a guardian angel-beast with feathered wings, a halo and a light blade', 'white feathers, gold halo'],
    ['フェアリ', '光の小妖精', 'a tiny luminous fairy with glowing dragonfly wings and a star wand', 'soft pastel glow'],
    ['ソル', '太陽を司る霊獣(オリジナル)', 'a solar beast crowned with a small sun, radiating warm light', 'bright gold and white'],
    ['ペガル', '光翼の聖天馬', 'a holy winged horse with radiant feathered wings and a star on its brow', 'white with luminous wings'],
    ['シシガミ', '森の聖獣(神鹿)', 'a forest deity stag with great antlers blooming with light and flowers', 'cream with glowing antlers'],
    ['ホーリ', '聖印を宿す光の獅子', 'a holy lion with a radiant mane and a glowing sacred sigil on its brow', 'golden mane, white fur'],
    ['クレリ', '鈴を鳴らす祝福の小獣', 'a small blessing creature carrying glowing bells, gentle and round', 'white and pale gold'],
    ['アーク', '審判の大天使(非人・荘厳)', 'an archangel-beast of judgment, towering with layered wings and a light spear', 'radiant white and gold'],
  ],
  冥: [
    ['レイス', '冷気をまとう亡霊レイス', 'a wraith specter, a tattered hooded phantom with cold glowing eyes', 'shadow black with pale blue glow'],
    ['リッチ', '不死の魔導師リッチ', 'a lich, a skeletal sorcerer in a dark robe wielding necrotic energy', 'bone white and dark purple'],
    ['ナイト', '夢を喰らう闇馬ナイトメア', 'a nightmare, a black horse with a burning shadow-mane and ember hooves', 'pitch black with violet flame'],
    ['ヴァンパ', '蝙蝠羽の吸血鬼獣', 'a vampire beast with bat wings, fangs and a tattered cape (beastly, non-human)', 'black and crimson'],
    ['ガイコ', '甲冑の骸骨騎士', 'a skeletal knight in cursed dark armor wielding a notched blade', 'bone and rusted black iron'],
    ['シャド', '実体なき影の獣(オリジナル)', 'an abstract shadow beast, a living silhouette with glowing eyes and claws', 'pure black with white eyes'],
    ['ケルベ', '冥府の番犬(三頭)', 'a hellhound guardian of the underworld with three heads and chains', 'black fur, glowing red eyes'],
    ['バンシ', '嘆きの妖鬼バンシー(非人)', 'a banshee wailing spirit, a veiled phantom trailing mournful mist', 'grey-violet, ghostly'],
    ['ルナル', '月を司る闇の霊獣(オリジナル)', 'a lunar beast veiled in night, crescent-moon markings and starry fur', 'deep indigo with silver crescents'],
    ['グリム', '鎌を持つ死神獣リーパー', 'a reaper beast in a black hooded cloak carrying a glowing scythe', 'black cloak, sickly green light'],
    ['ガスト', 'さまよう墓場の幽霊', 'a graveyard ghost, a small floating spirit with a sheet-like form and sad eyes', 'translucent pale grey'],
    ['ドゥラ', '首なし騎士デュラハン(伝説)', 'a dullahan headless knight on a shadow steed, holding its own glowing head', 'black armor, eerie green glow'],
  ],
  錬成: [
    ['ゴーレ', '錬金で生まれた人造ゴーレム', 'an alchemical homunculus golem of brass and clay with a glowing core', 'brass and verdigris'],
    ['メカド', '歯車仕掛けの機巧竜', 'a clockwork mechanical dragon of gears, pistons and riveted plates', 'bronze and steel'],
    ['オート', '自律する鎧オートマトン', 'an automaton, an empty suit of ornate armor animated by alchemy', 'silver and gold filigree'],
    ['ミスリ', 'ミスリル銀の守護騎士', 'a mithril-silver guardian construct with a knightly form and rune shield', 'bright silver with blue runes'],
    ['コグ', '歯車の小妖精(オリジナル)', 'a small cog-sprite, a tiny construct of spinning gears and a glass eye', 'brass with a glowing lens'],
    ['キマイ', '錬成キメラ(複数獣の合成)', 'an alchemical chimera stitched from parts of several beasts, mismatched limbs', 'patchwork of metal and hide'],
    ['アーコ', '魔法陣を浮かべる錬成獣', 'an arcane construct hovering glowing transmutation circles around itself', 'obsidian with luminous gold circles'],
    ['クロム', '液体金属の変身体', 'a liquid-metal shapeshifter, a chrome blob forming blades and limbs', 'mirror-chrome silver'],
    ['ヒュレ', '賢者の石を宿す人造体ホムンクルス(非人)', 'a homunculus vessel cradling a glowing philosophers stone in its chest', 'pale alabaster with red stone'],
    ['タロス', '巨大青銅像の守護者タロス(伝説)', 'a colossal bronze statue guardian (Talos) striding forward, seams glowing', 'aged bronze with glowing seams'],
    ['エーテ', 'エーテルの結晶生命(オリジナル)', 'an abstract aether construct of floating crystal shards and energy threads', 'translucent violet crystal'],
    ['マギナ', '錬金砲を備えた機鎧獣', 'a war-construct beast bristling with alchemical cannons and exhaust vents', 'iron grey with brass cannons'],
  ],
}

const SUF = { 1: ['', 'ィ', 'ッコ', 'ル', 'ミィ'], 2: ['ー', 'ガ', 'オン', 'ーザ', 'ドス'], 3: ['ドーン', 'ザード', 'レックス', 'ガイア', 'オルグ'] }
const WEIGHT = {
  火: [0.18, 0.27, 0.15, 0.19, 0.21], 水: [0.23, 0.16, 0.2, 0.15, 0.26], 風: [0.16, 0.2, 0.13, 0.31, 0.2],
  地: [0.27, 0.22, 0.27, 0.09, 0.15], 雷: [0.15, 0.18, 0.13, 0.29, 0.25], 毒: [0.2, 0.22, 0.19, 0.19, 0.2],
  聖: [0.2, 0.13, 0.18, 0.18, 0.31], 冥: [0.17, 0.19, 0.15, 0.25, 0.24], 錬成: [0.2, 0.2, 0.29, 0.13, 0.18],
}
const TOTAL = { 1: 300, 2: 420, 3: 540 }
const SIZES = [3, 3, 2, 3, 1, 3, 2, 3]
const SIG = {
  火: ['業火斬', '灼熱波', '獄炎弾', '紅蓮撃'], 水: ['激流斬', '津波', 'アクアジェット', '渦潮'], 風: ['真空波', '竜巻', 'ソニックブーム', '嵐撃'],
  地: ['大地割', '岩石落', 'クェイク', '巌砕'], 雷: ['雷光斬', '放電', 'ボルテッカー', '電磁砲'], 毒: ['猛毒牙', '毒霧', 'ヘドロ爆弾', '腐食波'],
  聖: ['聖光斬', '裁きの光', 'ホーリーレイ', '天罰'], 冥: ['暗黒波', '呪詛', 'シャドーエッジ', '冥府送り'], 錬成: ['錬成砲', '金属斬', 'メタルプレス', '歯車旋'],
}

const used = new Set(base.map((d) => d.name))
function uniqueName(n) {
  if (!used.has(n)) { used.add(n); return n }
  for (const tag of ['改', '真', 'II', 'γ', 'EX']) { const c = n + '・' + tag; if (!used.has(c)) { used.add(c); return c } }
  let i = 2; while (used.has(n + i)) i++; used.add(n + i); return n + i
}
function stats(type, tier, dex) {
  const total = TOTAL[tier] + ((dex % 31) - 15)
  return WEIGHT[type].map((wt) => Math.max(20, Math.round(total * wt)))
}

const out = []
const prompts = []
let dex = 101
let fam = 0
const typeFamCount = {}
const STAGE_DESC = { 1: 'small juvenile/hatchling form, soft rounded body, oversized eyes, a few early markings', 2: 'mature adult form, fuller defined body and limbs, clear elemental features', 3: 'colossal apex/elder form, grand and ornate with elaborate horns, crests or wings, battle-worn, radiating power' }
const STAGE_JP = { 1: 'の幼体。', 2: '。', 3: 'の最終形態とされ、強大な力を持つ。' }
const PREAMBLE =
  'Single original monster character for a creature-collecting RPG, full body, centered, dynamic three-quarter front view. ' +
  'Hand-painted ink-and-watercolor illustration in a Renaissance western-alchemy bestiary style: fine ink linework with luminous watercolor washes, painterly texture, dramatic yet clean readable silhouette. ' +
  'Cohesive with a hand-drawn monster compendium. No humans, no text, no border, no frame. TRANSPARENT background, soft contact shadow. Square 1024x1024.'

while (dex <= 300) {
  const type = TYPES[fam % 9]
  const ti = typeFamCount[type] ?? 0
  typeFamCount[type] = ti + 1
  let size = SIZES[fam % SIZES.length]
  if (dex + size - 1 > 300) size = 300 - dex + 1
  const arch = ARCH[type][ti % ARCH[type].length]
  const [root, jpDesc, enDesc, palette] = arch
  const sig = SIG[type][fam % SIG[type].length]
  const type2 = fam % 7 === 6 ? TYPES[(fam + 4) % 9] : undefined
  const ids = []
  for (let s = 0; s < size; s++) ids.push('g' + (dex + s))
  const lineNames = []
  for (let s = 0; s < size; s++) {
    const stage = size === 1 ? 1 : s + 1
    const tier = Math.min(3, stage)
    const name = uniqueName(root + SUF[tier][(fam + s) % 5])
    lineNames.push(name)
    const e = {
      dex: dex + s, id: ids[s], name, type, stage,
      from: s > 0 ? ids[s - 1] : null,
      to: s < size - 1 ? ids[s + 1] : null,
      at: s < size - 1 ? (s === 0 ? 16 + (fam % 4) : 34 + (fam % 5)) : null,
      stats: stats(type, tier, dex + s),
      sig,
      dex_text: jpDesc + STAGE_JP[tier],
    }
    if (type2 && s === size - 1) e.type2 = type2
    out.push(e)
    // プロンプト
    const t2 = type2 && s === size - 1 ? ` with secondary ${TYPE_EN[type2]} aspects` : ''
    prompts.push(
      `### #${e.dex} ${name}  (${e.id})  ${type}${e.type2 ? '/' + e.type2 : ''}・stage${stage}\n` +
        `保存先: \`public/sprites/${e.dex}.png\`\n\n` +
        '```\n' +
        PREAMBLE +
        `\nSubject: ${STAGE_DESC[tier]} of ${enDesc}, embodying the ${TYPE_EN[type]} element${t2}. ` +
        `Color palette: ${palette}. ` +
        `${stage === 1 ? 'Charming but characterful, clearly the baby of its line.' : stage === 2 ? 'Confident and agile mid-evolution.' : 'Imposing final evolution, the peak of its lineage.'} ` +
        `Keep a consistent design identity across the evolution line (${lineNames.join(' → ')}).` +
        '\n```\n',
    )
  }
  dex += size
  fam++
}

data.dex = [...base, ...out]
data.meta.count = data.dex.length
data.meta.generated_note = '101-300は scripts/gen_monsters.mjs によるアーキタイプ駆動の自動生成種(決定論的)。'
writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf8')

const md =
  '# 幻獣スプライト生成プロンプト（dex 101-300・自動生成種200体）\n\n' +
  '各幻獣の絵を `public/sprites/<図鑑番号>.png`（透過PNG・正方形）で保存すると自動反映されます。\n' +
  '下の各ブロックのプロンプトをそのまま画像生成AIに貼ってください。進化系統は同一デザインの成長として揃えると綺麗です。\n\n' +
  prompts.join('\n')
writeFileSync(promptPath, md, 'utf8')
console.log('dex total:', data.dex.length, ' new:', out.length, ' prompts:', prompts.length)
