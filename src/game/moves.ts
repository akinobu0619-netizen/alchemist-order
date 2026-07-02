// 技プール。各タイプの「基本技/強技/特殊技(状態異常・回復)」＋固有技を組み合わせて
// 各幻獣のレベルに応じた技セット(最大4)を生成する。
import type { Move, MonsterData } from '../types'

interface TypeKit {
  basic: Move // 低威力・高命中の物理
  blast: Move // 高威力の特殊
  tech: Move // 状態異常 or 回復
  rush: Move // タグ攻撃(先制/連撃/反動/吸収/高会心 等) L10
  aura: Move // ランク操作/ガード等のユーティリティ L14
}

const m = (mv: Move): Move => mv

export const TYPE_KIT: Record<string, TypeKit> = {
  火: {
    basic: m({ id: 'fire_b', name: 'ひのこ', type: '火', category: 'phys', power: 45, acc: 0.95, desc: '小さな炎をぶつける。' }),
    blast: m({ id: 'fire_x', name: 'かえんほうしゃ', type: '火', category: 'spec', power: 80, acc: 0.9, desc: '激しい炎を浴びせる。' }),
    tech: m({ id: 'fire_t', name: 'ひのいぶき', type: '火', category: 'status', power: 0, acc: 0.85, desc: '相手をやけど状態にする。', inflict: { status: 'やけど', chance: 1 } }),
    rush: m({ id: 'fire_r', name: 'フレイムダッシュ', type: '火', category: 'phys', power: 70, acc: 0.95, desc: '突進する。反動を受ける。', recoil: 0.25 }),
    aura: m({ id: 'fire_a', name: 'とうき', type: '火', category: 'status', power: 0, acc: 1, desc: '闘気を高め、こうげきをぐーんと上げる。', buffs: [{ target: 'self', stat: 'atk', delta: 2 }] }),
  },
  水: {
    basic: m({ id: 'water_b', name: 'みずでっぽう', type: '水', category: 'phys', power: 45, acc: 0.95, desc: '水を勢いよく飛ばす。' }),
    blast: m({ id: 'water_x', name: 'みずのはどう', type: '水', category: 'spec', power: 80, acc: 0.9, desc: '水の波動で攻撃。' }),
    tech: m({ id: 'water_t', name: 'れいきゃく', type: '水', category: 'status', power: 0, acc: 0.7, desc: '相手をこおらせる。', inflict: { status: 'こおり', chance: 1 } }),
    rush: m({ id: 'water_r', name: 'うずしお', type: '水', category: 'spec', power: 65, acc: 0.9, desc: '渦で攻撃し、相手のすばやさを下げる。', buffs: [{ target: 'foe', stat: 'spd', delta: -1 }] }),
    aura: m({ id: 'water_a', name: 'みずのまく', type: '水', category: 'status', power: 0, acc: 1, desc: '水の膜でぼうぎょをぐーんと上げる。', buffs: [{ target: 'self', stat: 'def', delta: 2 }] }),
  },
  風: {
    basic: m({ id: 'wind_b', name: 'つつく', type: '風', category: 'phys', power: 45, acc: 0.95, desc: 'くちばしや爪でつつく。' }),
    blast: m({ id: 'wind_x', name: 'エアスラッシュ', type: '風', category: 'spec', power: 80, acc: 0.9, desc: '風の刃で切り裂く。' }),
    tech: m({ id: 'wind_t', name: 'たつまき', type: '風', category: 'spec', power: 60, acc: 0.95, desc: '竜巻で確実に攻撃する。' }),
    rush: m({ id: 'wind_r', name: 'かぜのやいば', type: '風', category: 'phys', power: 40, acc: 1, desc: '必ず先手をとる風の刃。', priority: 1 }),
    aura: m({ id: 'wind_a', name: 'おいかぜ', type: '風', category: 'status', power: 0, acc: 1, desc: '追い風ですばやさをぐーんと上げる。', buffs: [{ target: 'self', stat: 'spd', delta: 2 }] }),
  },
  地: {
    basic: m({ id: 'earth_b', name: 'たいあたり', type: '地', category: 'phys', power: 45, acc: 0.95, desc: '全身でぶつかる。' }),
    blast: m({ id: 'earth_x', name: 'じしん', type: '地', category: 'phys', power: 85, acc: 0.9, desc: '大地を揺らす。' }),
    tech: m({ id: 'earth_t', name: 'ねむりごな', type: '地', category: 'status', power: 0, acc: 0.75, desc: '相手をねむり状態にする。', inflict: { status: 'ねむり', chance: 1 } }),
    rush: m({ id: 'earth_r', name: 'いわなだれ', type: '地', category: 'phys', power: 30, acc: 0.9, desc: '岩を2〜3回ぶつける。', multi: [2, 3] }),
    aura: m({ id: 'earth_a', name: 'まもりがため', type: '地', category: 'status', power: 0, acc: 1, desc: '身を固め、このターンの被ダメージを大きく減らす。', guard: true }),
  },
  雷: {
    basic: m({ id: 'volt_b', name: 'でんきショック', type: '雷', category: 'spec', power: 45, acc: 0.95, desc: '電撃を浴びせる。' }),
    blast: m({ id: 'volt_x', name: 'かみなり', type: '雷', category: 'spec', power: 90, acc: 0.8, desc: '強力な雷を落とす。' }),
    tech: m({ id: 'volt_t', name: 'でんじは', type: '雷', category: 'status', power: 0, acc: 0.9, desc: '相手をまひ状態にする。', inflict: { status: 'まひ', chance: 1 } }),
    rush: m({ id: 'volt_r', name: 'らいげき', type: '雷', category: 'spec', power: 65, acc: 0.9, desc: '急所に当たりやすい電撃。', critBoost: 0.25 }),
    aura: m({ id: 'volt_a', name: 'じゅうでん', type: '雷', category: 'status', power: 0, acc: 1, desc: '充電してまりょくをぐーんと上げる。', buffs: [{ target: 'self', stat: 'mag', delta: 2 }] }),
  },
  毒: {
    basic: m({ id: 'pois_b', name: 'どくづき', type: '毒', category: 'phys', power: 50, acc: 0.95, desc: '毒の牙や針で突く。', inflict: { status: 'どく', chance: 0.2 } }),
    blast: m({ id: 'pois_x', name: 'ヘドロこうげき', type: '毒', category: 'spec', power: 80, acc: 0.9, desc: '汚泥を浴びせる。' }),
    tech: m({ id: 'pois_t', name: 'どくのこな', type: '毒', category: 'status', power: 0, acc: 0.9, desc: '相手をどく状態にする。', inflict: { status: 'どく', chance: 1 } }),
    rush: m({ id: 'pois_r', name: 'ベノムショック', type: '毒', category: 'spec', power: 65, acc: 0.95, desc: '相手が状態異常なら威力が上がる。', bonusVsStatus: 1.5 }),
    aura: m({ id: 'pois_a', name: 'ようかいえき', type: '毒', category: 'status', power: 0, acc: 1, desc: '溶解液で相手のぼうぎょをがくっと下げる。', buffs: [{ target: 'foe', stat: 'def', delta: -2 }] }),
  },
  聖: {
    basic: m({ id: 'holy_b', name: 'ようせいのかぜ', type: '聖', category: 'spec', power: 45, acc: 0.95, desc: '神聖な風を起こす。' }),
    blast: m({ id: 'holy_x', name: 'マジカルレイ', type: '聖', category: 'spec', power: 80, acc: 0.9, desc: '聖なる光線を放つ。' }),
    tech: m({ id: 'holy_t', name: 'いやしのいのり', type: '聖', category: 'status', power: 0, acc: 1, desc: 'HPを回復し、自分の状態異常を治す。', heal: 0.5, cures: true }),
    rush: m({ id: 'holy_r', name: 'ひかりのはどう', type: '聖', category: 'spec', power: 60, acc: 1, desc: '必ず命中する聖なる波動。' }),
    aura: m({ id: 'holy_a', name: '加護の光', type: '聖', category: 'status', power: 0, acc: 1, desc: '加護を受け、ぼうぎょとまりょくを上げる。', buffs: [{ target: 'self', stat: 'def', delta: 1 }, { target: 'self', stat: 'mag', delta: 1 }] }),
  },
  冥: {
    basic: m({ id: 'dark_b', name: 'かげうち', type: '冥', category: 'phys', power: 45, acc: 0.95, desc: '影から不意を突く。' }),
    blast: m({ id: 'dark_x', name: 'シャドーボール', type: '冥', category: 'spec', power: 80, acc: 0.9, desc: '闇の塊をぶつける。' }),
    tech: m({ id: 'dark_t', name: 'はいかののろい', type: '冥', category: 'status', power: 0, acc: 0.85, desc: '相手を灰化させる。徐々に蝕む。', inflict: { status: '灰化', chance: 1 } }),
    rush: m({ id: 'dark_r', name: 'ソウルドレイン', type: '冥', category: 'spec', power: 60, acc: 0.95, desc: '与えたダメージの半分を吸収する。', drain: 0.5 }),
    aura: m({ id: 'dark_a', name: 'のろいのまなざし', type: '冥', category: 'status', power: 0, acc: 1, desc: '呪いの眼で相手のこうげきをがくっと下げる。', buffs: [{ target: 'foe', stat: 'atk', delta: -2 }] }),
  },
  錬成: {
    basic: m({ id: 'opus_b', name: 'メタルクロー', type: '錬成', category: 'phys', power: 50, acc: 0.95, desc: '硬い爪で引っかく。' }),
    blast: m({ id: 'opus_x', name: 'ラスターカノン', type: '錬成', category: 'spec', power: 80, acc: 0.9, desc: '光の砲撃を放つ。' }),
    tech: m({ id: 'opus_t', name: 'リペア', type: '錬成', category: 'status', power: 0, acc: 1, desc: '自己修復してHPを回復する。', heal: 0.45 }),
    rush: m({ id: 'opus_r', name: 'オーバーチャージ', type: '錬成', category: 'spec', power: 120, acc: 0.9, desc: '1ターン溜めて超火力を放つ。', charge: true }),
    aura: m({ id: 'opus_a', name: 'ちょうりつ', type: '錬成', category: 'status', power: 0, acc: 1, desc: '相手の能力変化をすべて元に戻す。', resetStages: true }),
  },
}

/** 固有技(その幻獣の代名詞。高威力の特殊技) */
export function signatureMove(sp: MonsterData): Move {
  return {
    id: `sig_${sp.id}`,
    name: sp.sig,
    type: sp.type,
    category: 'spec',
    power: 85,
    acc: 0.9,
    desc: 'この幻獣の代名詞となる必殺技。',
    ...(sp.type === '雷' ? { critBoost: 0.12 } : {}), // 雷の固有技は急所に当たりやすい
  }
}

/** 技idから Move を解決(守護者のカスタム技指定・遺伝技照合用)。'sig'=その種の固有技 */
export function moveById(id: string, sp: MonsterData): Move | null {
  if (id === 'sig') return signatureMove(sp)
  for (const kit of Object.values(TYPE_KIT)) {
    for (const mv of [kit.basic, kit.blast, kit.tech, kit.rush, kit.aura]) if (mv.id === id) return mv
  }
  return null
}

/** タイプ固有の「たいあたり」級の初期技 */
function starterTackle(type: string): Move {
  return { id: `tk_${type}`, name: 'たいあたり', type, category: 'phys', power: 40, acc: 1, desc: '全身でぶつかる基本技。' }
}

interface LearnEntry {
  lvl: number
  move: Move
}

/** 種ごとの習得表(学習レベル順)。最大4枠で、覚えると古い技と入れ替わる。 */
export function learnset(sp: MonsterData): LearnEntry[] {
  const t1 = sp.type
  const kit1 = TYPE_KIT[t1]
  const list: LearnEntry[] = [
    { lvl: 1, move: starterTackle(t1) },
    { lvl: 1, move: kit1.basic },
    { lvl: 7, move: kit1.tech },
    { lvl: 10, move: kit1.rush },
    { lvl: 14, move: kit1.aura },
    { lvl: 18, move: kit1.blast },
    { lvl: 22, move: signatureMove(sp) },
  ]
  // 複合タイプは副属性の大技を中盤で習得
  if (sp.type2 && TYPE_KIT[sp.type2]) list.push({ lvl: 16, move: TYPE_KIT[sp.type2].blast })
  return list.sort((a, b) => a.lvl - b.lvl)
}

/** 現在レベルで使える技(最大4・新しく覚えた順に4つ) */
export function getMoveset(sp: MonsterData, level: number): Move[] {
  const learned = learnset(sp)
    .filter((e) => level >= e.lvl)
    .map((e) => e.move)
  return learned.slice(-4)
}
