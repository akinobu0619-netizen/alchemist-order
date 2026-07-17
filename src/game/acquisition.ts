
import monstersJson from '../../data/monsters.json'
import type { MonsterData } from '../types'

export type AcquisitionRoute = 'starter' | 'wild' | 'levelup' | 'fusion' | 'item' | 'legendary'

const DEX = monstersJson.dex as MonsterData[]
const STARTERS = new Set(monstersJson.meta.starters as string[])
const BY_ID = new Map(DEX.map((m) => [m.id, m]))

function stableHash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function routeOf(id: string): AcquisitionRoute {
  const data = BY_ID.get(id)
  if (!data) return 'wild'
  if (data.role === 'legendary') return 'legendary'
  if (STARTERS.has(data.id)) return 'starter'
  if (data.stage === 1) return 'wild'
  if (data.stage === 2) return 'levelup'
  if (!data.id.startsWith('g')) return 'levelup'
  return (stableHash(data.id) & 1) === 0 ? 'fusion' : 'item'
}

export function isWildCatchable(id: string): boolean {
  return routeOf(id) === 'wild'
}

export function routeLabel(id: string): string {
  const route = routeOf(id)
  if (route === 'starter') return '最初の相棒'
  if (route === 'wild') return '野生で出現'
  if (route === 'levelup') return 'レベル進化'
  if (route === 'fusion') return '錬成でのみ出現'
  if (route === 'item') return '進化の秘香が必要'
  return '伝説の入手経路'
}
