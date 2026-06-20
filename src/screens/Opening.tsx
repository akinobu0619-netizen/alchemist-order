import { useState } from 'react'

// プロローグ。各ページ1〜2行。タップ or 「次へ」で進む。
const PAGES: string[][] = [
  ['空には、目に見えぬ粒子――《エーテル》が満ちている。', '錬金術師たちはそれを束ね、幻の獣を生み出す術を見いだした。'],
  ['幻獣を操る者は《錬獣師》と呼ばれ、', 'その頂点に立つ秩序こそ――《アルケミスト・オーダー》。'],
  ['ここは錬金の大陸アルケミア。あなたは地方の工房で学ぶ、ひとりの見習い。', '今日、師から はじめての幻獣の核を授かる日が来た。'],
  ['師は静かに、三つの核を差し出した。', '「さあ――共に往く相棒を、選びなさい。」'],
]

export default function Opening({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const last = i >= PAGES.length - 1
  const next = () => (last ? onDone() : setI(i + 1))

  return (
    <div className="opening-screen" onClick={next}>
      <div key={i} className="opening-box">
        {PAGES[i].map((line, k) => (
          <p key={k} className="opening-line">
            {line}
          </p>
        ))}
      </div>
      <div className="opening-controls" onClick={(e) => e.stopPropagation()}>
        <button className="opening-skip" onClick={onDone}>
          スキップ
        </button>
        <span className="opening-progress">
          {i + 1} / {PAGES.length}
        </span>
        <button className="opening-next" onClick={next}>
          {last ? '相棒を選ぶ ▶' : '次へ ▶'}
        </button>
      </div>
    </div>
  )
}
