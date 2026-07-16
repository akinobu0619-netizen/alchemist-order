import { useEffect, useMemo, useState } from 'react'
import type { BattleConfig, GameState, TrainerData } from '../types'
import type { Chest, Npc, NushiSpot, RuneSwitch } from '../game/maps'
import { hasFlag } from '../game/state'
import { systemRng } from '../engine/rng'
import { EXPLORE_WORLDS, MAP_BACKGROUNDS, type ExploreEvent, type ExploreNode } from '../game/nodes'
import { ItemIcon } from '../ui'

interface Props {
  state: GameState
  setState: (updater: (s: GameState) => GameState) => void
  onHome: () => void
  onVisitMap: (mapId: string) => void
  onStartBattle: (config: BattleConfig, auto?: boolean) => void
  onTrainer: (trainer: TrainerData, biome: string) => void
  onChest: (chest: Chest) => void
  onNushi: (nushi: NushiSpot, biome: string) => void
  onSwitch: (sw: RuneSwitch) => void
  onTalk: (npc: Npc) => void
}

const eventIcon: Record<ExploreEvent['kind'], string> = {
  battle: '⚔️',
  chest: '🎁',
  nushi: '🐾',
  switch: '🔷',
  talk: '💬',
  trainer: '🎖',
}

function isAvailable(event: ExploreEvent, state: GameState): boolean {
  if (event.kind === 'chest') return !hasFlag(state, `chest_${event.chest.id}`)
  if (event.kind === 'nushi') return !hasFlag(state, `nushi_${event.nushi.id}`)
  if (event.kind === 'switch') return !hasFlag(state, event.sw.flag)
  if (event.kind === 'trainer') return !state.defeatedTrainers.includes(event.trainer.id)
  return true
}

function fallbackEvent(node: ExploreNode): ExploreEvent | null {
  return node.events.find((event) => event.kind === 'battle') ?? node.events[0] ?? null
}

export default function Explore({ state, onHome, onVisitMap, onStartBattle, onTrainer, onChest, onNushi, onSwitch, onTalk }: Props) {
  const unlockedWorlds = EXPLORE_WORLDS.filter((world) => !world.unlock || state.badges.includes(world.unlock))
  const [worldId, setWorldId] = useState(unlockedWorlds[0]?.id ?? EXPLORE_WORLDS[0].id)
  const world = EXPLORE_WORLDS.find((w) => w.id === worldId) ?? unlockedWorlds[0] ?? EXPLORE_WORLDS[0]
  const [nodeIndex, setNodeIndex] = useState(0)
  const node = world.nodes[Math.min(nodeIndex, world.nodes.length - 1)]
  const [eventsDone, setEventsDone] = useState(0)
  const [pending, setPending] = useState<ExploreEvent | null>(null)
  const rng = useMemo(() => systemRng(), [worldId, nodeIndex])
  const mustChoose = eventsDone > 0 && eventsDone % 3 === 0 && !pending
  const bgUrl = `${import.meta.env.BASE_URL}${node.background}`

  useEffect(() => {
    setNodeIndex(0)
    setEventsDone(0)
    setPending(null)
  }, [worldId])

  useEffect(() => {
    onVisitMap(node.mapId)
  }, [node.mapId, onVisitMap])

  const drawEvent = () => {
    if (mustChoose) return
    const available = node.events.filter((event) => isAvailable(event, state))
    setPending(available.length ? rng.pick(available) : fallbackEvent(node))
  }

  const consume = () => {
    if (!pending) return
    const event = pending
    setPending(null)
    setEventsDone((n) => n + 1)
    if (event.kind === 'battle') onStartBattle(event.config, false)
    else if (event.kind === 'trainer') onTrainer(event.trainer, event.biome)
    else if (event.kind === 'chest') onChest(event.chest)
    else if (event.kind === 'nushi') onNushi(event.nushi, event.biome)
    else if (event.kind === 'switch') onSwitch(event.sw)
    else onTalk(event.npc)
  }


  const goNext = () => {
    setPending(null)
    setEventsDone(0)
    setNodeIndex((i) => Math.min(world.nodes.length - 1, i + 1))
  }

  const returnHome = () => {
    setPending(null)
    setEventsDone(0)
    onHome()
  }

  return (
    <div className="screen explore-screen">
      <header className="home-header">
        <h1>Explore</h1>
        <div className="home-stats">
          <span>Dex {state.caught.length}</span>
          <span>Badges {state.badges.length}</span>
          <span><ItemIcon kind="money" size={22} /> {state.money}</span>
        </div>
      </header>

      <div className="explore-backdrops" aria-hidden="true">
        {MAP_BACKGROUNDS.map((path) => (
          <span key={path} style={{ backgroundImage: `url(${import.meta.env.BASE_URL}${path})` }} />
        ))}
      </div>

      <section className="explore-worlds">
        {EXPLORE_WORLDS.map((w) => {
          const unlocked = !w.unlock || state.badges.includes(w.unlock)
          const cleared = state.defeatedTrainers.includes(w.boss)
          return (
            <button
              key={w.id}
              className={`explore-world ${w.id === world.id ? 'on' : ''}${unlocked ? '' : ' locked'}`}
              disabled={!unlocked}
              onClick={() => setWorldId(w.id)}
            >
              <span className="explore-world-icon">{unlocked ? w.icon : 'LOCK'}</span>
              <span>
                <b>{w.name}</b>
                <small>{cleared ? 'Cleared' : unlocked ? w.desc : `${w.unlock} unlocks`}</small>
              </span>
            </button>
          )
        })}
      </section>

      <section className="explore-node" style={{ backgroundImage: `linear-gradient(rgba(18,15,10,0.26), rgba(18,15,10,0.82)), url(${bgUrl})` }}>
        <div className="explore-node-head">
          <div>
            <div className="home-hero-kicker">Depth {node.depth}</div>
            <h2>{node.name}</h2>
            <p>{node.subtitle}</p>
          </div>
          <div className="explore-depth-dots" aria-label="explore depth">
            {world.nodes.map((n, i) => <span key={n.id} className={i <= nodeIndex ? 'on' : ''} />)}
          </div>
        </div>

        <div className="explore-event-panel">
          {pending ? (
            <div className={`explore-event ${pending.kind}`}>
              <span className="explore-event-icon">{eventIcon[pending.kind]}</span>
              <div>
                <h3>{pending.title}</h3>
                <p>{pending.desc}</p>
              </div>
              <div className="explore-event-actions">
                {pending.kind === 'battle' && (
                  <button className="home-primary-cta" onClick={() => { const ev = pending; setPending(null); setEventsDone((n) => n + 1); onStartBattle(ev.config, true) }}>
                    Auto Battle
                    <span>watch the battle, skip commands</span>
                  </button>
                )}
                <button className="home-secondary-cta" onClick={consume}>
                  {pending.kind === 'battle' ? 'Manual Battle' : pending.kind === 'trainer' || pending.kind === 'nushi' ? 'Challenge' : 'OK'}
                </button>
              </div>
            </div>
          ) : mustChoose ? (
            <div className="explore-choice">
              <h3>Keep exploring?</h3>
              <p>You cleared 3 events. Going deeper brings richer encounters.</p>
              <div className="home-hero-actions">
                <button className="home-primary-cta" onClick={goNext} disabled={nodeIndex >= world.nodes.length - 1}>
                  Go Deeper
                  <span>{nodeIndex >= world.nodes.length - 1 ? 'Deepest point' : 'Depth +1'}</span>
                </button>
                <button className="home-secondary-cta" onClick={returnHome}>Return</button>
              </div>
            </div>
          ) : (
            <div className="explore-choice">
              <h3>{world.icon} {world.name}</h3>
              <p>Move straight to the next event. Normal battles can run on auto; important battles stay manual.</p>
              <button className="home-primary-cta" onClick={drawEvent}>
                Advance
                <span>{3 - (eventsDone % 3)} events until choice</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="moves" style={{ marginTop: 14 }}>
        <button className="move-btn subtle" onClick={returnHome}>
          <span className="move-name">Return to Base</span>
          <span className="move-meta">Check party, items, and records</span>
        </button>
        <button className="move-btn" onClick={() => { setNodeIndex(0); setEventsDone(0); setPending(null) }}>
          <span className="move-name">Reset Area</span>
          <span className="move-meta">Reset this exploration route</span>
        </button>
      </div>
    </div>
  )
}
