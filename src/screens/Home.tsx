import { useState } from 'react'
import type { GameState, OwnedMonster } from '../types'
import { DEX_TOTAL, expToNext, species } from '../game/state'
import { statAt } from '../engine/battleEngine'
import { getMoveset } from '../game/moves'
import { ItemIcon, Sprite, TypeBadge } from '../ui'

interface Props {
  state: GameState
  setActive: (uid: string) => void
  onField: () => void
  onDex: () => void
}

const STAT_LABELS = ['さいだいHP', 'こうげき', 'ぼうぎょ', 'すばやさ', 'まりょく']
const STAT_MAX = 240 // ステータスバーの目安上限

function ownedStats(o: OwnedMonster) {
  const sp = species(o.speciesId)
  const [hp, atk, def, spd, mag] = sp.stats
  return {
    sp,
    maxHp: statAt(hp, o.level, true),
    values: [statAt(hp, o.level, true), statAt(atk, o.level), statAt(def, o.level), statAt(spd, o.level), statAt(mag, o.level)],
  }
}

export default function Home({ state, setActive, onField, onDex }: Props) {
  const active = state.collection.find((o) => o.uid === state.activeUid) ?? state.collection[0]
  const [tab, setTab] = useState<'party' | 'items'>('party')
  const [selUid, setSelUid] = useState(active.uid)
  const sel = state.collection.find((o) => o.uid === selUid) ?? active

  const { sp, maxHp, values } = ownedStats(sel)
  const curHp = sel.hp == null ? maxHp : sel.hp
  const hpRatio = Math.max(0, Math.min(1, curHp / maxHp))
  const hpColor = hpRatio > 0.5 ? '#43c463' : hpRatio > 0.2 ? '#e2c23b' : '#e2563b'
  const expNeed = expToNext(sel.level)
  const expRatio = Math.min(1, sel.exp / expNeed)
  const moves = getMoveset(sp, sel.level)
  const isActive = sel.uid === active.uid

  return (
    <div className="screen">
      <header className="home-header">
        <h1>メニュー</h1>
        <div className="home-stats">
          <span>📖 {state.caught.length}/{DEX_TOTAL}</span>
          <span>🎖 {state.badges.length}</span>
          <span>💰 {state.money}</span>
        </div>
      </header>

      <div className="menu-tabs">
        <button className={`menu-tab ${tab === 'party' ? 'on' : ''}`} onClick={() => setTab('party')}>
          手持ち
        </button>
        <button className={`menu-tab ${tab === 'items' ? 'on' : ''}`} onClick={() => setTab('items')}>
          どうぐ
        </button>
      </div>

      {tab === 'party' ? (
        <>
          {/* 選択中の幻獣 詳細 */}
          <div className="card detail-card">
            <div className="card-head">
              <span className="mon-name">
                {sp.name}
                {isActive && <span className="lead-tag">先頭</span>}
              </span>
              <span className="mon-lv">Lv.{sel.level}</span>
            </div>
            <div className="detail-top">
              <div className="detail-portrait">
                <Sprite id={sp.id} type={sp.type} size={96} />
                <div className="badges">
                  <TypeBadge t={sp.type} />
                  {sp.type2 && <TypeBadge t={sp.type2} />}
                </div>
              </div>
              <div className="grow">
                <div className="stat-line">
                  <span>HP</span>
                  <b style={{ color: hpColor }}>{curHp}</b> / {maxHp}
                </div>
                <div className="hpbar-outer">
                  <div className="hpbar-inner" style={{ width: `${hpRatio * 100}%`, background: hpColor }} />
                </div>
                <div className="stat-line" style={{ marginTop: 8 }}>
                  <span>EXP</span>
                  <span className="ink-dim">あと {Math.max(0, expNeed - sel.exp)}</span>
                </div>
                <div className="hpbar-outer">
                  <div className="hpbar-inner" style={{ width: `${expRatio * 100}%`, background: '#6fb3e2' }} />
                </div>
              </div>
            </div>

            {/* 5能力 */}
            <div className="stat-grid">
              {STAT_LABELS.map((label, i) => (
                <div className="stat-row" key={label}>
                  <span className="stat-name">{label}</span>
                  <span className="stat-val">{values[i]}</span>
                  <div className="stat-bar">
                    <div className="stat-fill" style={{ width: `${Math.min(100, (values[i] / STAT_MAX) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* おぼえている技 */}
            <h4 className="mini-title">おぼえている技</h4>
            <div className="move-list">
              {moves.map((mv) => (
                <div className="move-chip" key={mv.id}>
                  <span className="mc-name">{mv.name}</span>
                  <span className="mc-meta">
                    <TypeBadge t={mv.type} />
                    {mv.category === 'status' ? (mv.heal ? '回復' : '状態') : `威${mv.power}`}・命{Math.round(mv.acc * 100)}
                  </span>
                </div>
              ))}
            </div>

            <p className="dex-text">{sp.dex_text}</p>
            {!isActive && (
              <button className="title-btn primary" style={{ width: '100%', marginTop: 6 }} onClick={() => setActive(sel.uid)}>
                先頭にする
              </button>
            )}
          </div>

          {/* 手持ち一覧 */}
          <h3 className="section-title">手持ち {state.collection.length}体（タップで詳細）</h3>
          <div className="party-list">
            {state.collection.map((o) => {
              const st = ownedStats(o)
              const hp = o.hp == null ? st.maxHp : o.hp
              const ratio = Math.max(0, Math.min(1, hp / st.maxHp))
              const col = ratio > 0.5 ? '#43c463' : ratio > 0.2 ? '#e2c23b' : '#e2563b'
              return (
                <button key={o.uid} className={`party-row ${o.uid === selUid ? 'sel' : ''}`} onClick={() => setSelUid(o.uid)}>
                  <Sprite id={st.sp.id} type={st.sp.type} size={44} />
                  <div className="pr-info">
                    <div className="pr-head">
                      <span className="pr-name">{st.sp.name}</span>
                      {o.uid === active.uid && <span className="lead-tag">先頭</span>}
                      <span className="pr-lv">Lv.{o.level}</span>
                    </div>
                    <div className="pr-hpbar">
                      <div className="pr-hpfill" style={{ width: `${ratio * 100}%`, background: col }} />
                    </div>
                    <div className="pr-hptext">HP {hp}/{st.maxHp}</div>
                  </div>
                  <TypeBadge t={st.sp.type} />
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="items-pane">
          <div className="money-box">所持金 <b>💰 {state.money}</b> ゲル</div>
          <div className="item-row">
            <span className="item-ico"><ItemIcon kind="heal" size={32} /></span>
            <div className="grow">
              <div className="item-name">傷薬</div>
              <div className="item-desc">HPを60%回復する</div>
            </div>
            <span className="item-count">×{state.items.heal}</span>
          </div>
          <div className="item-row">
            <span className="item-ico"><ItemIcon kind="heal2" size={32} /></span>
            <div className="grow">
              <div className="item-name">上傷薬</div>
              <div className="item-desc">HPを全回復する</div>
            </div>
            <span className="item-count">×{state.items.heal2}</span>
          </div>
          <div className="item-row">
            <span className="item-ico"><ItemIcon kind="flask" size={32} /></span>
            <div className="grow">
              <div className="item-name">封獣フラスコ</div>
              <div className="item-desc">野生の幻獣を捕まえる</div>
            </div>
            <span className="item-count">×{state.flasks}</span>
          </div>
          <h3 className="section-title">記章 {state.badges.length}/8</h3>
          <div className="badge-list">
            {state.badges.length === 0 && <span className="ink-dim">まだ記章を持っていない。</span>}
            {state.badges.map((b) => (
              <span key={b} className="badge-pill">🎖 {b}</span>
            ))}
          </div>
        </div>
      )}

      <div className="moves" style={{ marginTop: 18 }}>
        <button className="move-btn" onClick={onField}>
          <span className="move-name">🗺 ぼうけんに もどる</span>
          <span className="move-meta">フィールドを探索する</span>
        </button>
        <button className="move-btn" onClick={onDex}>
          <span className="move-name">📖 幻獣図鑑をひらく</span>
          <span className="move-meta">{state.caught.length}/{DEX_TOTAL} 体を記録</span>
        </button>
      </div>
    </div>
  )
}
