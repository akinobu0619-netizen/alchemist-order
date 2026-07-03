// シード付き乱数ストリーム(SPEC_RNG_REPLAY.md §2)。
// mulberry32(本体) + cyrb128(文字列→シード)。fork(label)は「シード文字列+ラベル」から
// 子ストリームを派生するため、親の消費位置に依存しない(=乱数を1個増やしても他系統がズレない)。
// ゲームプレイの乱数は必ずこのI/F経由にする。Math.random直呼びは audio.ts(演出)のみ許可。

export interface Rng {
  /** [0,1) — Math.random互換 */
  next(): number
  /** lo..hi の整数(両端含む) */
  int(lo: number, hi: number): number
  /** next() < p */
  chance(p: number): boolean
  /** 配列から1要素 */
  pick<T>(arr: readonly T[]): T
  /** 子ストリームを派生。同じseed+labelなら常に同じ列 */
  fork(label: string): Rng
}

/** 文字列→128bitハッシュ(4x32bit)。PRNGシード用(暗号用途ではない) */
function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703
  let h2 = 3144134277
  let h3 = 1013904242
  let h4 = 2773480762
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0]
}

/** mulberry32: 32bitシードの高速PRNG */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function wrap(next: () => number, seedKey: string): Rng {
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    fork: (label) => makeRng(`${seedKey}|${label}`),
  }
}

/** シード付きストリームを生成。同じ文字列=同じ列 */
export function makeRng(seed: string): Rng {
  const [h1] = cyrb128(seed)
  return wrap(mulberry32(h1), seed)
}

/** 非シードの既定ストリーム(Math.random委譲)。通常戦・フィールド等の「まだ決定論不要」な箇所用 */
export function systemRng(): Rng {
  const next = () => Math.random()
  const rng: Rng = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    fork: () => rng,
  }
  return rng
}
