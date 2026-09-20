import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { TypeWriter } from '../../components/TypeWriter'
import { TerminalFrame } from './TerminalFrame'
import bg1Axes from '../../assets/bg/bg1-axes.svg'
import bg1RingA from '../../assets/bg/bg1-ring-a.svg'
import bg1RingB from '../../assets/bg/bg1-ring-b.svg'
import bg2Axes from '../../assets/bg/bg2-axes.svg'
import bg2RingA from '../../assets/bg/bg2-ring-a.svg'
import bg2RingB from '../../assets/bg/bg2-ring-b.svg'
import bg3Axes from '../../assets/bg/bg3-axes.svg'
import bg3RingA from '../../assets/bg/bg3-ring-a.svg'

type ScreenProps = {
  /** Called once this step is finished (auto after a hold, or on click). */
  onNext?: () => void
}

const LOG = [
  '> establishing signal........... ',
  '> scanning temporal frequency.... ',
  '> locating her era.............. ',
  '> decrypting memory fragments... ',
  '> connection established ✓',
]

type RingVars = {
  fromX?: string
  fromY?: string
  driftX?: string
  driftY?: string
  delay?: string
  cx?: string
  cy?: string
}
const ringStyle = (v: RingVars) =>
  ({
    '--from-x': v.fromX,
    '--from-y': v.fromY,
    '--drift-x': v.driftX,
    '--drift-y': v.driftY,
    '--delay': v.delay,
    '--cx': v.cx,
    '--cy': v.cy,
  }) as CSSProperties

/**
 * Shared step logic: `stage` walks through the typing blocks; clicking while
 * typing reveals everything, clicking after that (or waiting `holdMs`) advances.
 */
function useSequence(steps: number, holdMs: number, onNext?: () => void) {
  const [stage, setStage] = useState(0)
  const [skipped, setSkipped] = useState(false)
  const finished = skipped || stage >= steps
  const advanced = useRef(false)
  const onNextRef = useRef(onNext)
  useEffect(() => {
    onNextRef.current = onNext
  })

  const next = () => {
    if (advanced.current || !onNextRef.current) return
    advanced.current = true
    onNextRef.current()
  }

  useEffect(() => {
    if (!finished) return
    const t = window.setTimeout(() => {
      if (advanced.current || !onNextRef.current) return
      advanced.current = true
      onNextRef.current()
    }, holdMs)
    return () => window.clearTimeout(t)
  }, [finished, holdMs])

  return {
    stage,
    skipped,
    step: (i: number) => () => setStage((s) => Math.max(s, i + 1)),
    onClick: () => (finished ? next() : setSkipped(true)),
  }
}

/** Figma: background 1 (743:37891) — boot log + signal detected */
export function Background1({ onNext }: ScreenProps) {
  const seq = useSequence(2, 1000, onNext)
  return (
    <TerminalFrame nodeId="743:37891" onClick={seq.onClick} label="시그널 접속 중 — 클릭하면 건너뛰기">
      <img className="bg-art bg-art--axes" src={bg1Axes} alt="" />
      <img
        className="bg-art bg-art--ring"
        src={bg1RingA}
        alt=""
        style={ringStyle({ fromY: '322px', driftY: '-10px' })}
      />
      <img
        className="bg-art bg-art--ring"
        src={bg1RingB}
        alt=""
        style={ringStyle({ fromY: '-240px', driftY: '10px', delay: '0.65s' })}
      />
      <TypeWriter className="connect-log" lines={LOG} startDelay={900} complete={seq.skipped} onDone={seq.step(0)} />
      <TypeWriter
        className="connect-wave"
        lines={['∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿', 'signal ))) ))) ))) detected']}
        active={seq.stage >= 1}
        startDelay={350}
        complete={seq.skipped}
        cursor="persist"
        onDone={seq.step(1)}
      />
    </TerminalFrame>
  )
}

/** Figma: background 2 (743:38494) — signal lost */
export function Background2({ onNext }: ScreenProps) {
  const seq = useSequence(1, 1200, onNext)
  const glitching = seq.stage >= 1 || seq.skipped
  return (
    <TerminalFrame nodeId="743:38494" onClick={seq.onClick} label="시그널 탐색 중 — 클릭하면 건너뛰기">
      <img className="bg-art bg-art--axes" src={bg2Axes} alt="" />
      <img
        className="bg-art bg-art--ring"
        src={bg2RingA}
        alt=""
        style={ringStyle({
          fromX: '0px',
          fromY: '280px',
          driftX: '8px',
          driftY: '-8px',
        })}
      />
      <img
        className="bg-art bg-art--ring"
        src={bg2RingB}
        alt=""
        style={ringStyle({ fromY: '-240px', driftX: '-12px', delay: '0.65s' })}
      />

      <TypeWriter className="connect-log" lines={LOG} complete cursor="none" />
      <TypeWriter
        className={`connect-lost${glitching ? ' signal-lost' : ''}`}
        lines={['c̶o̶n̶n̶e̶c̶t̶i̶n̶g̶...', '01001000 01000101 01010010', '▓▓▒▒░░ SIGNAL LOST ░░▒▒▓▓', '▓▒░ reconnecting... ░▒▓']}
        startDelay={900}
        complete={seq.skipped}
        cursor="persist"
        onDone={seq.step(0)}
      />
    </TerminalFrame>
  )
}

const WAVE = '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁'

/** Figma: background 3 (743:39107) — receiving her signal */
export function Background3({ onNext }: ScreenProps) {
  const seq = useSequence(1, 2600, onNext)
  const live = seq.stage >= 1 || seq.skipped
  const [shift, setShift] = useState(0)

  // once typed, the waveform keeps scrolling like a live signal meter
  useEffect(() => {
    if (!live) return
    const t = window.setInterval(() => setShift((s) => (s + 1) % 14), 90)
    return () => window.clearInterval(t)
  }, [live])
  const wave = WAVE.slice(shift) + WAVE.slice(1, shift + 1)

  return (
    <TerminalFrame nodeId="743:39107" onClick={seq.onClick} label="그녀의 시그널 수신 — 클릭하면 계속">
      <img className="bg-art bg-art--axes" src={bg3Axes} alt="" />
      <img
        className="bg-art bg-art--ring"
        src={bg3RingA}
        alt=""
        style={ringStyle({
          fromX: '-220px',
          fromY: '100px',
          driftY: '12px',
          delay: '0.65s',
        })}
      />

      <TypeWriter className="connect-log" lines={LOG} complete cursor="none" />
      {live ? (
        <div className="typewriter connect-signal" aria-label="receiving signal from her">
          <div className="typewriter__line">{wave}</div>
          <div className="typewriter__line">
            <span className="receiving__dots">···</span> receiving signal from her{' '}
            <span className="receiving__dots">···</span>
          </div>
        </div>
      ) : (
        <TypeWriter
          className="connect-signal"
          lines={[WAVE, '··· receiving signal from her ···']}
          startDelay={900}
          cursor="none"
          onDone={seq.step(0)}
        />
      )}
    </TerminalFrame>
  )
}
