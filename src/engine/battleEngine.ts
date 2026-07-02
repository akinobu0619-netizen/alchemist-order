// バトルエンジン — 純粋関数の集合。UI から分離してテスト可能に保つ。
import type { Combatant, Move, MonsterData, TypeChart } from '../types'
import typechartJson from '../../data/typechart.json'
import { abilityIdOf, heldItemOf } from '../game/abilities'

const TC = typechartJson as unknown as TypeChart

/** 種族値とレベルから実ステータスを算出 (ポケモン風の簡易式) */
export function statAt(base: number, level: number, isHp = false): number {
  const core = Math.floor((2 * base * level) / 100)
  return isHp ? core + level + 10 : core + 5
}

/** 能力ランク(-3..+3)→倍率。+1=1.33 +2=1.67 +3=2.0 / -1=0.75 -2=0.6 -3=0.5 */
export function stageMult(stage: number): number {
  const s = Math.max(-3, Math.min(3, stage))
  return s >= 0 ? (3 + s) / 3 : 3 / (3 - s)
}
export const CRIT_BASE = 0.06 // 基礎会心率

/** MonsterData から指定レベルのバトル個体を生成。talentで全能力に+4%/段＋もちもの能力倍率＋特性(俊足) */
export function makeCombatant(data: MonsterData, level: number, talent = 0, heldItem?: string): Combatant {
  const [hp, atk, def, spd, mag] = data.stats
  const m = 1 + Math.max(0, talent) * 0.04
  const ability = abilityIdOf(data)
  const sm = heldItemOf(heldItem)?.statMult ?? {}
  const atkM = m * (sm.atk ?? 1)
  const magM = m * (sm.mag ?? 1)
  const hpM = m * (sm.hp ?? 1)
  let spdM = m * (sm.spd ?? 1)
  if (ability === 'swift') spdM *= 1.15 // 特性:俊足
  const maxHp = Math.round(statAt(hp, level, true) * hpM)
  return {
    data,
    level,
    talent,
    ability,
    heldItem,
    berryUsed: false,
    maxHp,
    hp: maxHp,
    atk: Math.round(statAt(atk, level) * atkM),
    def: Math.round(statAt(def, level) * m),
    spd: Math.round(statAt(spd, level) * spdM),
    mag: Math.round(statAt(mag, level) * magM),
    status: null,
    statusTurns: 0,
    stages: { atk: 0, def: 0, spd: 0, mag: 0 },
  }
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
  crit: boolean // 会心
}

/** ダメージ計算 (状態異常・能力ランク・会心・ガード込み) */
export function calcDamage(
  attacker: Combatant,
  defender: Combatant,
  move: Move,
  rand: number = 0.85 + Math.random() * 0.15,
  critRand: number = Math.random(),
): DamageResult {
  if (move.category === 'status' || move.power <= 0) return { damage: 0, eff: 1, stab: false, crit: false }
  const stab = move.type === attacker.data.type || move.type === attacker.data.type2
  // 特性:浮遊 — 地タイプ無効
  if (move.type === '地' && defender.ability === 'levitate') return { damage: 0, eff: 0, stab, crit: false }
  // 攻撃実効値: 能力ランク → やけど半減 → 剛力 の順
  let atkStat = Math.round((move.category === 'phys' ? attacker.atk : attacker.mag) * stageMult(move.category === 'phys' ? attacker.stages.atk : attacker.stages.mag))
  if (attacker.status === 'やけど' && move.category === 'phys') atkStat = Math.floor(atkStat / 2)
  if (attacker.ability === 'guts' && attacker.status && move.category === 'phys') atkStat = Math.floor(atkStat * 1.5)
  const defStat = Math.max(1, Math.round(defender.def * stageMult(defender.stages.def)))
  const defTypes = [defender.data.type, defender.data.type2].filter(Boolean) as string[]
  const eff = effectiveness(move.type, defTypes)

  // 補正倍率
  let mult = 1
  if (attacker.ability === 'blaze' && attacker.hp <= attacker.maxHp / 3 && stab) mult *= 1.5 // 烈火
  if (move.bonusVsStatus && defender.status) mult *= move.bonusVsStatus // 状態異常特効
  if (defender.ability === 'ward') mult *= 0.85 // 加護
  const dmgMult = heldItemOf(defender.heldItem)?.dmgTakenMult
  if (dmgMult) mult *= dmgMult // 守りの護符
  if (defender.guarding) mult *= 0.3 // ガード中
  if (attacker.status === '灰化') mult *= 0.85 // 灰化
  // 会心(相性無効時は発生しない)
  const crit = eff > 0 && critRand < (move.critBoost ?? CRIT_BASE)
  if (crit) mult *= 1.5

  const base = Math.floor(
    ((2 * attacker.level) / 5 + 2) * move.power * (atkStat / defStat) / 50 + 2,
  )
  const dmg = eff === 0 ? 0 : Math.max(1, Math.floor(base * (stab ? 1.5 : 1) * eff * rand * mult))
  return { damage: dmg, eff, stab, crit }
}

/** 相性倍率を日本語メッセージに */
export function effMessage(eff: number): string {
  if (eff === 0) return '効果がないようだ……'
  if (eff >= 2) return 'こうかは ばつぐんだ！'
  if (eff > 1) return 'すこし効いている。'
  if (eff < 1) return 'こうかは いまひとつのようだ。'
  return ''
}

/** まひ時はすばやさ半減 */
export function effectiveSpeed(c: Combatant): number {
  const spd = Math.round(c.spd * stageMult(c.stages?.spd ?? 0))
  return c.status === 'まひ' ? Math.max(1, Math.floor(spd / 2)) : spd
}

/** 行動前チェック(ねむり/こおり/まひ)。行動可否と状態変化後の値を返す */
export function preMoveCheck(c: Combatant): {
  act: boolean
  msg?: string
  status: Combatant['status']
  statusTurns: number
} {
  if (c.status === 'ねむり') {
    const t = c.statusTurns - 1
    if (t <= 0) return { act: true, msg: `${c.data.name}は 目を覚ました！`, status: null, statusTurns: 0 }
    return { act: false, msg: `${c.data.name}は ぐっすり 眠っている。`, status: 'ねむり', statusTurns: t }
  }
  if (c.status === 'こおり') {
    if (Math.random() < 0.25) return { act: true, msg: `${c.data.name}の こおりが とけた！`, status: null, statusTurns: 0 }
    return { act: false, msg: `${c.data.name}は こおって 動けない！`, status: 'こおり', statusTurns: c.statusTurns }
  }
  if (c.status === 'まひ' && Math.random() < 0.25) {
    return { act: false, msg: `${c.data.name}は からだが しびれて 動けない！`, status: 'まひ', statusTurns: c.statusTurns }
  }
  return { act: true, status: c.status, statusTurns: c.statusTurns }
}

/** ターン終了時の状態異常ダメージ(やけど/どく/灰化) */
export function endTurnStatus(c: Combatant): { dmg: number; msg?: string } {
  if (c.hp <= 0 || !c.status) return { dmg: 0 }
  if (c.status === 'やけど') return { dmg: Math.max(1, Math.floor(c.maxHp / 16)), msg: `${c.data.name}は やけどの ダメージ！` }
  if (c.status === 'どく') return { dmg: Math.max(1, Math.floor(c.maxHp / 16)), msg: `${c.data.name}は どくの ダメージ！` }
  if (c.status === '灰化') return { dmg: Math.max(1, Math.floor(c.maxHp / 12)), msg: `${c.data.name}は 灰化に 蝕まれている……` }
  return { dmg: 0 }
}

export type { Combatant, Move, MonsterData, TypeChart }
