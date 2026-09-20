import { useEffect, useState } from 'react'
import symbol from '../assets/title/symbol.svg'
import logo from '../assets/title/logo.svg'
import cornerTL from '../assets/title/corner-tl.svg'
import cornerTR from '../assets/title/corner-tr.svg'
import cornerBL from '../assets/title/corner-bl.svg'
import cornerBR from '../assets/title/corner-br.svg'
import './OpeningTitle.css'

type Props = {
  /** Called when the player clicks after the intro has finished. */
  onStart?: () => void
}

/** Total intro length in ms — keep in sync with OpeningTitle.css */
const INTRO_MS = 4800

/**
 * Figma: "opening - title" (743:26273)
 * Intro: 1) corner brackets draw out from their elbows
 *        2) signature symbol spins around its vertical axis
 *        3) logo opens from the centre dash, then the prompt fades up
 * Clicking during the intro skips to the end; the next click starts the game.
 */
export function OpeningTitle({ onStart }: Props) {
  const [introDone, setIntroDone] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setIntroDone(true), INTRO_MS)
    return () => window.clearTimeout(t)
  }, [])

  const handleClick = () => {
    if (!introDone) {
      setIntroDone(true)
      return
    }
    onStart?.()
  }

  return (
    <button
      type="button"
      className={`opening-title${introDone ? ' is-intro-done' : ''}`}
      onClick={handleClick}
      aria-label={introDone ? 'She-gNAL 시작하기' : '인트로 건너뛰기'}
      data-node-id="743:26273"
    >
      <img className="layer opening-title__corner opening-title__corner--tl" src={cornerTL} alt="" />
      <img className="layer opening-title__corner opening-title__corner--tr" src={cornerTR} alt="" />
      <img className="layer opening-title__corner opening-title__corner--bl" src={cornerBL} alt="" />
      <img className="layer opening-title__corner opening-title__corner--br" src={cornerBR} alt="" />

      <span className="opening-title__symbol-wrap">
        <img className="layer opening-title__symbol" src={symbol} alt="" />
      </span>
      <img className="layer opening-title__logo" src={logo} alt="She-gNAL" />

      <span className="opening-title__prompt">sign at that time</span>
    </button>
  )
}
