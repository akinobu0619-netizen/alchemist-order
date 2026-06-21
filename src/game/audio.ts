// BGMマネージャ。public/audio/<key>.mp3 をループ再生。画面遷移で切替、勝利ジングル、ミュート対応。
// ブラウザの自動再生制限のため、最初のユーザー操作で unlock() してから鳴らす。
const BASE = import.meta.env.BASE_URL
const VOL = 0.5

let bgm: HTMLAudioElement | null = null
let bgmKey: string | null = null
let unlocked = false
let muted = false
try {
  muted = localStorage.getItem('ao-muted') === '1'
} catch {
  /* noop */
}

function ensure(): HTMLAudioElement {
  if (!bgm) {
    bgm = new Audio()
    bgm.loop = true
    bgm.volume = VOL
    bgm.preload = 'auto'
  }
  return bgm
}

/** 指定キーのBGMをループ再生(同じキーなら何もしない) */
export function playBgm(key: string): void {
  if (key === bgmKey) return
  bgmKey = key
  const el = ensure()
  el.src = `${BASE}audio/${key}.mp3`
  el.loop = true
  if (!muted && unlocked) el.play().catch(() => {})
}

/** 最初のユーザー操作で呼ぶ。再生を解禁し、保留中のBGMを鳴らす */
export function unlock(): void {
  if (unlocked) return
  unlocked = true
  if (!muted && bgm && bgmKey) bgm.play().catch(() => {})
}

/** 勝利ジングル(一度きり)。BGMを止めて鳴らす。次の playBgm で再開される */
export function playVictory(): void {
  if (bgm) bgm.pause()
  bgmKey = null
  if (muted || !unlocked) return
  const v = new Audio(`${BASE}audio/victory.mp3`)
  v.volume = VOL
  v.play().catch(() => {})
}

export function isMuted(): boolean {
  return muted
}

/** ミュート切替。状態を返す */
export function toggleMute(): boolean {
  muted = !muted
  try {
    localStorage.setItem('ao-muted', muted ? '1' : '0')
  } catch {
    /* noop */
  }
  if (bgm) {
    if (muted) bgm.pause()
    else if (unlocked) bgm.play().catch(() => {})
  }
  return muted
}
