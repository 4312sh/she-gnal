import { useEffect, useState } from 'react'
import { GyroSymbol } from '../components/GyroSymbol'
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
 *        2) gyro symbol fades in and keeps tumbling (웹2.mov 느낌)
 *        3) logo opens from the centre dash, then the prompt fades up
 * 1st click : 인트로를 끝내고 심볼을 Figma 정지 포즈로 고정 (약 1.9초)
 * 2nd click : 고정이 끝난 뒤 게임 시작. 고정 중 클릭은 무시
 */
export function OpeningTitle({ onStart }: Props) {
  const [introDone, setIntroDone] = useState(false)
  const [locked, setLocked] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setIntroDone(true), INTRO_MS)
    return () => window.clearTimeout(t)
  }, [])

  const handleClick = () => {
    if (!locked) {
      setIntroDone(true)
      setLocked(true)
      return
    }
    if (settled) onStart?.()
  }

  const stateClass = [
    introDone && 'is-intro-done',
    locked && 'is-locked',
    settled && 'is-settled',
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={`opening-title ${stateClass}`}
      onClick={handleClick}
      aria-label={settled ? 'She-gNAL 시작하기' : '신호 고정하기'}
      data-node-id="743:26273"
    >
      <img className="layer opening-title__corner opening-title__corner--tl" src={cornerTL} alt="" />
      <img className="layer opening-title__corner opening-title__corner--tr" src={cornerTR} alt="" />
      <img className="layer opening-title__corner opening-title__corner--bl" src={cornerBL} alt="" />
      <img className="layer opening-title__corner opening-title__corner--br" src={cornerBR} alt="" />

      <GyroSymbol className="opening-title__gyro" locked={locked} onSettled={() => setSettled(true)}>
        <img src={symbol} alt="" draggable={false} />
      </GyroSymbol>
      <img className="layer opening-title__logo" src={logo} alt="She-gNAL" />

      <span className="opening-title__prompt">sign at that time</span>
    </button>
  )
}
