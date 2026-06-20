import { useEffect, useState } from 'react'
import type { BattleConfig, GameState } from './types'
import {
  STARTER_IDS,
  loadGame,
  makeOwned,
  newGame,
  saveGame,
  species,
  withCaught,
  withSeen,
} from './game/state'
import { Sprite, TypeBadge } from './ui'
import Home from './screens/Home'
import Battle from './screens/Battle'
import Dex from './screens/Dex'
import Field from './screens/Field'
import Opening from './screens/Opening'

type Phase = 'title' | 'opening' | 'starter' | 'game'
type Screen = 'field' | 'home' | 'battle' | 'dex'

const STARTER_LEVEL = 8
const STARTER_FLASKS = 8

// タイトル背景(あれば bg/title.jpg、無ければテーマ色)
const titleBg = {
  backgroundColor: '#15120d',
  backgroundImage: `linear-gradient(rgba(18,15,10,0.55), rgba(18,15,10,0.82)), url(${import.meta.env.BASE_URL}bg/title.jpg)`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

export default function App() {
  const [game, setGame] = useState<GameState>(() => loadGame() ?? newGame())
  const [phase, setPhase] = useState<Phase>('title')
  const [screen, setScreen] = useState<Screen>('field')
  const [battleConfig, setBattleConfig] = useState<BattleConfig | null>(null)

  useEffect(() => {
    saveGame(game)
  }, [game])

  const hasSave = game.collection.length > 0

  // ── タイトル画面 ──
  if (phase === 'title') {
    return (
      <div className="app">
        <div className="title-screen" style={titleBg}>
          <div className="title-logo">
            <h1>錬金幻獣録</h1>
            <h2>アルケミスト・オーダー</h2>
          </div>
          <div className="title-buttons">
            {hasSave && (
              <button
                className="title-btn primary"
                onClick={() => {
                  setScreen('field')
                  setPhase('game')
                }}
              >
                つづきから
              </button>
            )}
            <button className={`title-btn ${hasSave ? '' : 'primary'}`} onClick={() => setPhase('opening')}>
              {hasSave ? 'さいしょから' : 'はじめる'}
            </button>
          </div>
          <p className="title-foot">全100体・9属性 / 育成RPG</p>
        </div>
      </div>
    )
  }

  // ── オープニング ──
  if (phase === 'opening') {
    return (
      <div className="app">
        <Opening onDone={() => setPhase('starter')} />
      </div>
    )
  }

  // ── 御三家選択 ──
  if (phase === 'starter') {
    const pick = (id: string) => {
      const owned = makeOwned(id, STARTER_LEVEL)
      setGame(() => {
        let next: GameState = {
          ...newGame(),
          collection: [owned],
          activeUid: owned.uid,
          flasks: STARTER_FLASKS,
        }
        next = withCaught(withSeen(next, id), id)
        return next
      })
      setScreen('field')
      setPhase('game')
    }
    return (
      <div className="app">
        <header>
          <h1>錬金幻獣録</h1>
          <h2>アルケミスト・オーダー</h2>
          <p className="subtitle">師「さあ――共に往く相棒を、選びなさい。」</p>
        </header>
        <div className="starter-grid">
          {STARTER_IDS.map((id) => {
            const m = species(id)
            return (
              <button key={id} className="starter" onClick={() => pick(id)}>
                <Sprite id={id} type={m.type} size={72} />
                <div className="mon-name">{m.name}</div>
                <TypeBadge t={m.type} />
                <p className="dex-text">{m.dex_text}</p>
              </button>
            )
          })}
        </div>
        <footer>
          <button className="link-btn" onClick={() => setPhase('title')}>
            ← タイトルへ
          </button>
        </footer>
      </div>
    )
  }

  // ── ゲーム本編 ──
  const active = game.collection.find((o) => o.uid === game.activeUid) ?? game.collection[0]
  const startBattle = (config: BattleConfig) => {
    setBattleConfig(config)
    setScreen('battle')
  }

  return (
    <div className="app">
      {screen === 'field' && (
        <Field state={game} setState={setGame} onStartBattle={startBattle} onMenu={() => setScreen('home')} />
      )}
      {screen === 'home' && (
        <Home
          state={game}
          setActive={(uid) => setGame((s) => ({ ...s, activeUid: uid }))}
          onField={() => setScreen('field')}
          onDex={() => setScreen('dex')}
        />
      )}
      {screen === 'battle' && battleConfig && (
        <Battle
          active={active}
          config={battleConfig}
          state={game}
          setState={setGame}
          onExit={() => setScreen('field')}
        />
      )}
      {screen === 'dex' && <Dex state={game} onBack={() => setScreen('home')} />}
    </div>
  )
}
