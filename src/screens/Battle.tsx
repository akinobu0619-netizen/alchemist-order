import { useEffect, useRef, useState } from 'react'
import type { BattleConfig, Combatant, GameState, Move, OwnedMonster } from '../types'
import { calcDamage, effMessage, makeCombatant, movesOf } from '../engine/battleEngine'
import {
  DEX,
  catchChance,
  expReward,
  grantExp,
  species,
  withCaught,
  withSeen,
} from '../game/state'
import { HpBar, Sprite, TypeBadge } from '../ui'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))

function makeWild(playerLevel: number, config: Extract<BattleConfig, { kind: 'wild' }>): Combatant {
  const pool = config.pool?.length
    ? config.pool
    : DEX.filter((d) => d.role !== 'legendary' && d.stage <= 2).map((d) => d.id)
  const id = pool[Math.floor(Math.random() * pool.length)]
  const level =
    config.min != null && config.max != null
      ? randInt(config.min, config.max)
      : clamp(playerLevel + Math.floor(Math.random() * 4) - 2, 2, 100)
  return makeCombatant(species(id), level)
}

type Phase = 'fighting' | 'won' | 'lost' | 'caught' | 'fled'

interface Props {
  active: OwnedMonster
  config: BattleConfig
  state: GameState
  setState: (updater: (s: GameState) => GameState) => void
  onExit: () => void
}

export default function Battle({ active, config, state, setState, onExit }: Props) {
  const isTrainer = config.kind === 'trainer'
  const teamRef = useRef<Combatant[]>(
    config.kind === 'trainer'
      ? config.trainer.team.map((t) => makeCombatant(species(t.speciesId), t.level))
      : [],
  )
  const ownedRef = useRef<OwnedMonster>({ ...active })

  const [player, setPlayer] = useState<Combatant>(() => makeCombatant(species(active.speciesId), active.level))
  const [enemy, setEnemy] = useState<Combatant>(() =>
    config.kind === 'trainer' ? teamRef.current[0] : makeWild(active.level, config),
  )
  const [enemyIndex, setEnemyIndex] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>('fighting')
  const [acting, setActing] = useState(false)
  const busy = useRef(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (config.kind === 'trainer') {
      setLog([
        `${config.trainer.name}が しょうぶを しかけてきた！`,
        `${config.trainer.name}は ${enemy.data.name}を くりだした！`,
        `ゆけ、${player.data.name}！`,
      ])
      setState((s) => config.trainer.team.reduce((acc, t) => withSeen(acc, t.speciesId), s))
    } else {
      setLog([`あ！ 野生の ${enemy.data.name} が あらわれた！`, `ゆけ、${player.data.name}！`])
      setState((s) => withSeen(s, enemy.data.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pushLog(...lines: string[]) {
    setLog((prev) => [...prev, ...lines])
    requestAnimationFrame(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }

  /** 経験値付与(進化・図鑑登録も処理)。ログ用メッセージを返す */
  function gainExp(reward: number): string[] {
    const prevSpecies = ownedRef.current.speciesId
    const msgs = grantExp(ownedRef.current, reward)
    const evolvedTo = ownedRef.current.speciesId !== prevSpecies ? ownedRef.current.speciesId : null
    setState((s) => {
      let next: GameState = {
        ...s,
        collection: s.collection.map((o) => (o.uid === ownedRef.current.uid ? { ...ownedRef.current } : o)),
      }
      if (evolvedTo) next = withCaught(withSeen(next, evolvedTo), evolvedTo)
      return next
    })
    return [`${player.data.name}は ${reward} の経験値を得た！`, ...msgs]
  }

  /** 敵が倒れたときの処理。トレーナーなら次を繰り出す */
  function onEnemyDown() {
    const expMsgs = gainExp(expReward(enemy.level))
    if (config.kind === 'trainer') {
      const team = teamRef.current
      if (enemyIndex + 1 < team.length) {
        const next = team[enemyIndex + 1]
        setEnemyIndex(enemyIndex + 1)
        setEnemy(next)
        pushLog(`${enemy.data.name}を たおした！`, ...expMsgs, `${config.trainer.name}は ${next.data.name}を くりだした！`)
        return
      }
      setState((s) => ({
        ...s,
        wins: s.wins + 1,
        badges: s.badges.includes(config.trainer.badge) ? s.badges : [...s.badges, config.trainer.badge],
        defeatedTrainers: s.defeatedTrainers.includes(config.trainer.id)
          ? s.defeatedTrainers
          : [...s.defeatedTrainers, config.trainer.id],
      }))
      pushLog(
        `${enemy.data.name}を たおした！`,
        ...expMsgs,
        `${config.trainer.name}に かった！`,
        `🎖 ${config.trainer.badge}を 手に入れた！`,
      )
      setPhase('won')
      return
    }
    // 野生
    setState((s) => ({ ...s, wins: s.wins + 1, flasks: s.flasks + 1 }))
    pushLog(`野生の ${enemy.data.name} を たおした！`, ...expMsgs, '🔮 封獣フラスコを 1個 拾った！')
    setPhase('won')
  }

  async function takeTurn(pMove: Move) {
    if (busy.current || phase !== 'fighting') return
    busy.current = true
    setActing(true)

    const eMoves = movesOf(enemy)
    const eMove = eMoves[Math.floor(Math.random() * eMoves.length)]
    let pHp = player.hp
    let eHp = enemy.hp
    const order: ('p' | 'e')[] = player.spd >= enemy.spd ? ['p', 'e'] : ['e', 'p']

    for (const who of order) {
      if (pHp <= 0 || eHp <= 0) break
      await sleep(650)
      if (who === 'p') {
        const r = calcDamage(player, enemy, pMove)
        eHp = Math.max(0, eHp - r.damage)
        setEnemy((prev) => ({ ...prev, hp: eHp }))
        const msg = effMessage(r.eff)
        pushLog(`${player.data.name}の ${pMove.name}！`, ...(msg ? [msg] : []))
        if (eHp <= 0) {
          await sleep(450)
          onEnemyDown()
          break
        }
      } else {
        const r = calcDamage(enemy, player, eMove)
        pHp = Math.max(0, pHp - r.damage)
        setPlayer((prev) => ({ ...prev, hp: pHp }))
        const msg = effMessage(r.eff)
        pushLog(`${isTrainer ? '' : '野生の '}${enemy.data.name}の ${eMove.name}！`, ...(msg ? [msg] : []))
        if (pHp <= 0) {
          await sleep(450)
          pushLog(`${player.data.name}は たおれてしまった……`, '💀 アジトに もどされた。')
          setPhase('lost')
          break
        }
      }
    }
    busy.current = false
    setActing(false)
  }

  async function throwFlask() {
    if (busy.current || phase !== 'fighting' || config.kind !== 'wild') return
    if (state.flasks <= 0) {
      pushLog('封獣フラスコを 持っていない！')
      return
    }
    busy.current = true
    setActing(true)
    setState((s) => ({ ...s, flasks: s.flasks - 1 }))
    pushLog('封獣フラスコを なげた！ ……', 'クルクル……')
    await sleep(900)

    if (Math.random() < catchChance(enemy)) {
      const caught: OwnedMonster = {
        uid: `m${Date.now().toString(36)}_c`,
        speciesId: enemy.data.id,
        level: enemy.level,
        exp: 0,
      }
      setState((s) => withCaught({ ...s, collection: [...s.collection, caught] }, enemy.data.id))
      pushLog(`やった！ 野生の ${enemy.data.name}を 捕まえた！`, '🔮 図鑑に 登録された。')
      setPhase('caught')
    } else {
      pushLog('ああっ！ 幻獣が フラスコから 出てしまった！')
      await sleep(500)
      const eMoves = movesOf(enemy)
      const eMove = eMoves[Math.floor(Math.random() * eMoves.length)]
      const r = calcDamage(enemy, player, eMove)
      const pHp = Math.max(0, player.hp - r.damage)
      setPlayer((prev) => ({ ...prev, hp: pHp }))
      const msg = effMessage(r.eff)
      pushLog(`野生の ${enemy.data.name}の ${eMove.name}！`, ...(msg ? [msg] : []))
      if (pHp <= 0) {
        await sleep(450)
        pushLog(`${player.data.name}は たおれてしまった……`)
        setPhase('lost')
      }
    }
    busy.current = false
    setActing(false)
  }

  function flee() {
    if (busy.current || phase !== 'fighting' || config.kind !== 'wild') return
    pushLog('うまく にげきった！')
    setPhase('fled')
  }

  const playerMoves = movesOf(player)
  const remaining = isTrainer ? teamRef.current.length - enemyIndex : 0

  return (
    <div className="screen">
      {isTrainer && config.kind === 'trainer' && (
        <div className="trainer-banner">
          ⚔ {config.trainer.name} — 残り {remaining} 体
        </div>
      )}
      <div className="battlefield">
        <div className="card enemy">
          <div className="card-head">
            <span className="mon-name">{enemy.data.name}</span>
            <span className="mon-lv">Lv.{enemy.level}</span>
          </div>
          <div className="row">
            <Sprite name={enemy.data.name} type={enemy.data.type} />
            <div className="grow">
              <div className="badges">
                <TypeBadge t={enemy.data.type} />
                {enemy.data.type2 && <TypeBadge t={enemy.data.type2} />}
              </div>
              <HpBar c={enemy} />
            </div>
          </div>
        </div>

        <div className="vs">VS</div>

        <div className="card player">
          <div className="card-head">
            <span className="mon-name">{player.data.name}</span>
            <span className="mon-lv">Lv.{player.level}</span>
          </div>
          <div className="row">
            <Sprite name={player.data.name} type={player.data.type} />
            <div className="grow">
              <div className="badges">
                <TypeBadge t={player.data.type} />
                {player.data.type2 && <TypeBadge t={player.data.type2} />}
              </div>
              <HpBar c={player} />
            </div>
          </div>
        </div>
      </div>

      <div className="log">
        {log.map((l, i) => (
          <div key={i} className="log-line">
            {l}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {phase === 'fighting' ? (
        <>
          <div className="moves">
            {playerMoves.map((mv) => (
              <button key={mv.name} className="move-btn" disabled={acting} onClick={() => takeTurn(mv)}>
                <span className="move-name">{mv.name}</span>
                <span className="move-meta">
                  <TypeBadge t={mv.type} /> 威力{mv.power}・{mv.category === 'phys' ? '物理' : '特殊'}
                </span>
              </button>
            ))}
          </div>
          {config.kind === 'wild' && (
            <div className="moves" style={{ marginTop: 12 }}>
              <button className="move-btn" disabled={acting || state.flasks <= 0} onClick={throwFlask}>
                <span className="move-name">封獣フラスコを投げる</span>
                <span className="move-meta">
                  残り{state.flasks}個・捕獲率およそ{Math.round(catchChance(enemy) * 100)}%
                </span>
              </button>
              <button className="move-btn ghost" disabled={acting} onClick={flee}>
                にげる
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="result-actions">
          <button className="move-btn" onClick={onExit}>
            フィールドに もどる
          </button>
        </div>
      )}
    </div>
  )
}
