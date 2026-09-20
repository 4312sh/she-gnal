import { useEffect, useRef, useState } from 'react'
import { TypeWriter } from '../components/TypeWriter'
import './BootLoader.css'

type Props = {
  onDone: () => void
}

const BOOT_LINES = [
  'SHE-GNAL TEMPORAL VM  v0.9.17',
  '(c) signal-at-that-time systems',
  '',
  '> mounting /dev/era ................ ok',
  '> allocating memory 256M ........... ok',
  '> loading frequency drivers ........ ok',
  '> starting virtual environment',
]

/** Hold after the boot text + bar finish, before handing over to background 1. */
const HOLD_MS = 450

/**
 * Interstitial between "how to play" and background 1: a black console that
 * boots like a virtual machine, so the scene change feels like loading.
 */
export function BootLoader({ onDone }: Props) {
  const [typed, setTyped] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  })

  useEffect(() => {
    if (!typed || !loaded) return
    const t = window.setTimeout(() => doneRef.current(), HOLD_MS)
    return () => window.clearTimeout(t)
  }, [typed, loaded])

  const skip = () => {
    setTyped(true)
    setLoaded(true)
  }

  return (
    <button type="button" className="boot" onClick={skip} aria-label="가상 환경 로딩 중 — 클릭하면 건너뛰기">
      <TypeWriter
        className="boot__log"
        lines={BOOT_LINES}
        speed={8}
        linePause={90}
        startDelay={750}
        complete={typed && loaded}
        cursor="persist"
        onDone={() => setTyped(true)}
      />

      <div className={`boot__progress${typed ? ' is-running' : ''}`}>
        <span className="boot__label">booting</span>
        <span className="boot__bar">
          <span
            className="boot__fill"
            style={loaded ? { animation: 'none', width: '100%' } : undefined}
            onAnimationEnd={() => setLoaded(true)}
          />
        </span>
      </div>

      <div className="boot__scanlines" aria-hidden />
    </button>
  )
}
