// dex 1-100 のプロンプトを 101-300 と同じリッチ形式へ更新する。
// 既存 MONSTER_ART_PROMPTS.md の「具体的な被写体コンセプト」を活かし、
// 統一プリアンブル＋属性＋カラーパレット＋進化系統の一貫性を付与する。
// 実行: node scripts/gen_prompts_1_100.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const data = JSON.parse(readFileSync('data/monsters.json', 'utf8'))
const dexAll = data.dex
const byId = new Map(dexAll.map((d) => [d.id, d]))
const byDex = new Map(dexAll.map((d) => [d.dex, d]))

const TYPE_EN = { 火: 'fire', 水: 'water', 風: 'wind', 地: 'earth', 雷: 'lightning', 毒: 'poison', 聖: 'holy/light', 冥: 'dark/death', 錬成: 'alchemical/metallic' }
const PALETTE = {
  火: 'crimson and orange with glowing magma veins',
  水: 'aqua blue, translucent and dewy',
  風: 'pale teal and silver-white, airy and feathered',
  地: 'earthy brown and mossy green with weathered stone texture',
  雷: 'golden yellow and deep indigo with crackling sparks',
  毒: 'toxic purple and sickly green, slick and venomous',
  聖: 'radiant gold and ivory white with a soft halo glow',
  冥: 'shadow black and deep violet with an eerie pale glow',
  錬成: 'brass, verdigris and arcane teal with glowing alchemical sigils',
}
const STAGE_FLAVOR = {
  1: 'Charming but characterful, clearly the early form of its line.',
  2: 'Confident and agile mid-evolution.',
  3: 'Imposing final evolution, the peak of its lineage.',
}
const PREAMBLE =
  'Single original monster character for a creature-collecting RPG, full body, centered, dynamic three-quarter front view. ' +
  'Hand-painted ink-and-watercolor illustration in a Renaissance western-alchemy bestiary style: fine ink linework with luminous watercolor washes, painterly texture, dramatic yet clean readable silhouette. ' +
  'Cohesive with a hand-drawn monster compendium. No humans, no text, no border, no frame. TRANSPARENT background, soft contact shadow. Square 1024x1024.'

// 固定の元データ(旧・具体コンセプト)から dex番号→英語コンセプト を抽出
// ※ 出力先(MONSTER_ART_PROMPTS.md)ではなく凍結コピーを読むことで再実行に対して安全
const old = readFileSync('scripts/concepts_1_100.legacy.md', 'utf8')
const concept = new Map()
for (const line of old.split('\n')) {
  const m = line.match(/^- `0*(\d+)\.png`.*?:\s*(.+?)\s*$/)
  if (m) concept.set(Number(m[1]), m[2].replace(/\.$/, ''))
}

// 進化系統の名前列(from/to を辿る)
function chainNames(d) {
  let head = d
  while (head.from && byId.has(head.from)) head = byId.get(head.from)
  const names = []
  let cur = head
  while (cur) {
    names.push(cur.name)
    cur = cur.to && byId.has(cur.to) ? byId.get(cur.to) : null
  }
  return names
}

let body = ''
let missing = []
for (let n = 1; n <= 100; n++) {
  const d = byDex.get(n)
  if (!d) continue
  const subj = concept.get(n)
  if (!subj) missing.push(n)
  const core = subj || `a ${TYPE_EN[d.type]}-element creature (${d.name})`
  const t2 = d.type2 ? ` with secondary ${TYPE_EN[d.type2]} aspects` : ''
  const chain = chainNames(d)
  const isStandalone = chain.length <= 1
  const flavor = isStandalone ? 'A characterful standalone species.' : STAGE_FLAVOR[Math.min(3, d.stage)]
  const chainLine = isStandalone ? '' : ` Keep a consistent design identity across the evolution line (${chain.join(' → ')}).`
  const num = String(n).padStart(3, '0')
  body +=
    `### #${n} ${d.name}  (${d.id})  ${d.type}${d.type2 ? '/' + d.type2 : ''}・stage${d.stage}\n` +
    `保存先: \`public/sprites/${num}.png\`\n\n` +
    '```\n' +
    PREAMBLE +
    `\nSubject: ${core}, embodying the ${TYPE_EN[d.type]} element${t2}. ` +
    `Color palette: ${PALETTE[d.type]}. ` +
    `${flavor}${chainLine}` +
    '\n```\n\n'
}

// ボス(図鑑外)。スプライト番号は生成種(101-300)と衝突しないよう 301- を使う。
const BOSS_NO = { magnus: '301', abysschimera: '302' }
const BOSS_CONCEPT = {
  magnus: concept.get(101) || 'a fallen genius alchemist as a humanoid boss, robed figure wreathed in grey ash and corrupted alchemical energy',
  abysschimera: concept.get(102) || "a forbidden chimera horror born from a corrupted philosopher's stone, fusing celestial gold and abyssal darkness, awe-inspiring and terrible",
}
let bossBody = '\n---\n\n## ボス（図鑑外）\n\n'
for (const b of data.bosses ?? []) {
  const num = BOSS_NO[b.id] || b.id
  const core = (BOSS_CONCEPT[b.id] || `a fearsome ${TYPE_EN[b.type]} boss (${b.name})`).replace(/\.$/, '')
  const t2 = b.type2 ? ` with secondary ${TYPE_EN[b.type2]} aspects` : ''
  bossBody +=
    `### ★ ${b.name}  (${b.id})  ${b.type}${b.type2 ? '/' + b.type2 : ''}・${b.role === 'final_boss' ? '最終ボス' : 'ボス'}\n` +
    `保存先: \`public/sprites/${num}.png\`（図鑑外）\n\n` +
    '```\n' +
    PREAMBLE +
    `\nSubject: ${core}, embodying the ${TYPE_EN[b.type]} element${t2}. ` +
    `Color palette: ${PALETTE[b.type]}. ` +
    'A climactic boss — larger, more ornate and menacing than any wild creature, radiating overwhelming presence.' +
    '\n```\n\n'
}

const header =
  '# 幻獣スプライト生成プロンプト（dex 1-100・固有種100体）\n\n' +
  '各幻獣の絵を `public/sprites/<図鑑番号3桁>.png`（透過PNG・正方形）で保存すると自動反映されます。\n' +
  '各ブロックのプロンプトはそれ自体で完結（先頭の画風指定込み）。そのまま画像生成AIに貼ってください。\n' +
  '進化系統は同一デザインの成長として揃えると綺麗です（各ブロック末尾に系統名を明記）。\n' +
  '※101-300は `MONSTER_ART_PROMPTS_300.md`。同じ形式・画風で統一しています。\n\n---\n\n'

writeFileSync('MONSTER_ART_PROMPTS.md', header + body + bossBody, 'utf8')
console.log(`wrote MONSTER_ART_PROMPTS.md (1-100). missing concept for: ${missing.join(',') || 'none'}`)
