// バトルエンジン — 純粋関数の集合。UI から分離してテスト可能に保つ。
import type { Combatant, Move, MonsterData, TypeChart } from '../types'
import typechartJson from '../../data/typechart.json'

const TC = typechartJson as unknown as TypeChart

/** 種族値とレベルから実ステータスを算出 (ポケモン風の簡易式) */
export function statAt(base: number, level: number, isHp = false): number {
  const core = Math.floor((2 * base * level) / 100)
  return isHp ? core + level + 10 : core + 5
}

/** MonsterData から指定レベルのバトル個体を生成 */
export function makeCombatant(data: MonsterData, level: number): Combatant {
  const [hp, atk, def, spd, mag] = data.stats
  const maxHp = statAt(hp, level, true)
  return {
    data,
    level,
    maxHp,
    hp: maxHp,
    atk: statAt(atk, level),
    def: statAt(def, level),
    spd: statAt(spd, level),
    mag: statAt(mag, level),
  }
}

/** 個体が使える技 (MVP: 通常攻撃 + 固有技の2つ) */
export function movesOf(c: Combatant): Move[] {
  return [
    { name: 'こうげき', power: 50, category: 'phys', type: c.data.type },
    { name: c.data.sig, power: 80, category: 'spec', type: c.data.type },
  ]
}

/** 攻撃タイプ → 防御側(複合可)への相性倍率 */
export function effectiveness(attackType: string, defenderTypes: string[]): number {
  const row = TC.chart[attackType] ?? {}
  let mult = 1
  for (const dt of defenderTypes) {
    if (row[dt] !== undefined) mult *= row[dt]
  }
  return mult
}

export interface DamageResult {
  damage: number
  eff: number // 相性倍率
  stab: boolean // タイプ一致
}

/** ダメージ計算 */
export function calcDamage(
  attacker: Combatant,
  defender: Combatant,
  move: Move,
  rand: number = 0.85 + Math.random() * 0.15,
): DamageResult {
  const atkStat = move.category === 'phys' ? attacker.atk : attacker.mag
  const defStat = defender.def
  const stab = move.type === attacker.data.type || move.type === attacker.data.type2
  const defTypes = [defender.data.type, defender.data.type2].filter(Boolean) as string[]
  const eff = effectiveness(move.type, defTypes)

  const base = Math.floor(
    ((2 * attacker.level) / 5 + 2) * move.power * (atkStat / defStat) / 50 + 2,
  )
  const damage = eff === 0 ? 0 : Math.max(1, Math.floor(base * (stab ? 1.5 : 1) * eff * rand))
  return { damage, eff, stab }
}

/** 相性倍率を日本語メッセージに */
export function effMessage(eff: number): string {
  if (eff === 0) return '効果がないようだ……'
  if (eff >= 2) return 'こうかは ばつぐんだ！'
  if (eff > 1) return 'すこし効いている。'
  if (eff < 1) return 'こうかは いまひとつのようだ。'
  return ''
}

export type { Combatant, Move, MonsterData, TypeChart }
