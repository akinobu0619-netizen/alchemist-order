import { useState } from 'react'

// プロローグ。各ページ1〜2行。タップ or 「次へ」で進む。
// 構成: 神話の引用→世界の仕組み(エーテル/幻獣/錬獣師/オーダー)→脅威(灰化)→希望(記章)→あなた(村・旅立ちの朝)。
// テーマ「喪失と再生」(STORY.md)を序盤から匂わせる。正史は STORY.md / 台詞集は DIALOGUE.md。
const PAGES: string[][] = [
  ['『世界は かつて、神々の錬金釜だった』――', '古い絵本は、そんな一文から始まる。'],
  ['この大陸の空には、目に見えない光の粒――《エーテル》が満ちている。', '錬金術師は それを束ねて命を編み……幻獣という、ふしぎな隣人を生み出した。'],
  ['幻獣と絆を結び、共に歩む者は《錬獣師》と呼ばれる。', 'その頂点に立つ組織こそ――《アルケミスト・オーダー》。'],
  ['だが いま、大陸は 静かな病に蝕まれている。', 'その名は――《灰化》。'],
  ['灰化した幻獣は、まず色を失う。次に、心を。', '……最後には、大切な人の顔さえ忘れて、暴れ出す。'],
  ['オーダーは各地の《守護者》に記章を託した。', '八つの記章を集めた者だけが、中枢へ――灰化の元凶へ挑む資格を得る。'],
  ['ここは大陸の南のはずれ、始まりの村ラピス。', 'あなたは錬金工房で学ぶ、ひとりの見習い。'],
  ['今日は、特別な朝。師から はじめての幻獣を授かる――旅立ちの日。', '窓の外は晴れ。階下から、母の声がする。……さあ、目を覚まそう。'],
  ['【操作】矢印キー、または画面の十字ボタンで移動。人や物に向かって進むと調べられる。', '画面上の 🎯 が、つねに次の目標を教えてくれる。迷ったら、それに従おう。'],
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
          {last ? '目を覚ます ▶' : '次へ ▶'}
        </button>
      </div>
    </div>
  )
}
