import { useState } from 'react'
import decor from '../assets/rules/decor.svg'
import bracketsInset from '../assets/rules/brackets-inset.svg'
import bracketsEdge from '../assets/rules/brackets-edge.svg'
import './HowToPlay.css'
import { playSfx } from '../game/sfx'

type Props = {
  onNext: () => void
}

/** 규칙 설명 두 장. 1장 → NEXT → 2장 → NEXT → 다음 화면 */
const PAGES = [
  {
    node: '1463:8115',
    lines: ['Through a Signal that travels across time,', 'you speak with women who lived in different eras.'],
  },
  {
    node: '1463:8515',
    lines: [
      'Answering the signals they send from the past, present,',
      'and future, you experience the emotions and social structures of',
      'each era firsthand in this narrative dialogue game.',
    ],
  },
]

/**
 * Figma: "how to play" 1장 (1463:8115) → 2장 (1463:8515)
 * 1장은 안쪽 브래킷, 2장은 화면 모서리 브래킷 — 넘길 때 브래킷이 바깥으로 벌어진다
 */
export function HowToPlay({ onNext }: Props) {
  const [page, setPage] = useState(0)
  const last = page === PAGES.length - 1

  return (
    <div className={`how-to-play how-to-play--page${page + 1}`} data-node-id={PAGES[page].node}>
      <img className="layer how-to-play__decor" src={decor} alt="" />
      <img className="layer how-to-play__decor how-to-play__brackets--inset" src={bracketsInset} alt="" />
      <img className="layer how-to-play__decor how-to-play__brackets--edge" src={bracketsEdge} alt="" />

      <h1 className="how-to-play__title">She-GNAL: Tune Into Her Era — Game Rules</h1>

      <div className="how-to-play__panel">
        <p key={page} className="how-to-play__body">
          {PAGES[page].lines.map((l, i) => (
            <span key={i}>
              {l}
              {i < PAGES[page].lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      </div>

      <button type="button" className="how-to-play__next" onClick={() => {
          playSfx(last ? 'open' : 'click')
          if (last) onNext()
          else setPage(page + 1)
        }}
        onPointerEnter={() => playSfx('hover')}
      >
        next
      </button>
    </div>
  )
}
