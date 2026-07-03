// Math.random直呼びの混入チェック(SPEC_RNG_REPLAY.md §9のlint代替)。
// ゲームプレイ乱数は必ず src/engine/rng.ts の Rng 経由にする。許可リスト以外で検出したらビルド失敗。
// 実行: node scripts/check_rng.mjs (package.json の build に組込済)
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const SRC = join(ROOT, 'src')

// Math.random を書いてよいファイル(理由つき)
const ALLOW = new Set([
  'src/engine/rng.ts', // 公認ラッパー(systemRng)本体
  'src/game/audio.ts', // 演出専用(ノイズ生成)。ゲームプレイに影響しない
  'src/App.tsx', // シードnonce生成(ここがランの熵源そのもの)
])

const hits = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { walk(p); continue }
    if (!/\.(ts|tsx)$/.test(name)) continue
    const rel = relative(ROOT, p).replaceAll('\\', '/')
    if (ALLOW.has(rel)) continue
    const lines = readFileSync(p, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const noComment = line.replace(/\/\/.*$/, '')
      if (noComment.includes('Math.random')) hits.push(`${rel}:${i + 1}: ${line.trim()}`)
    })
  }
}
walk(SRC)

if (hits.length) {
  console.error('✗ Math.random 直呼びを検出。src/engine/rng.ts の Rng を使うこと(SPEC_RNG_REPLAY.md):')
  for (const h of hits) console.error('  ' + h)
  process.exit(1)
}
console.log('✓ check_rng: Math.random 直呼びなし(許可リスト除く)')
