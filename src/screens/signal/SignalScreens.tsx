import { useEffect, useRef, useState, type ReactNode } from 'react'
import planet from '../../assets/connect/planet.svg'
import { TypeWriter } from '../../components/TypeWriter'
import type { Era } from '../../game/eras'
import './Signal.css'

type ScreenProps = { onNext?: () => void }

const LOG = [
  '> establishing signal........... ',
  '> scanning temporal frequency.... ',
  '> locating her era.............. ',
  '> decrypting memory fragments... ',
  '> connection established ✓',
]

/** typing stages → click to reveal all → click (or wait) to advance */
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

function SignalFrame({
  nodeId,
  label,
  onClick,
  children,
}: {
  nodeId: string
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className="signal" onClick={onClick} aria-label={label} data-node-id={nodeId}>
      <>
        <div className="term-panel" />
        {children}
      </>
    </button>
  )
}

/** Figma: 접속중 화면 1 (743:22994) */
export function Signal1({ onNext }: ScreenProps) {
  const seq = useSequence(1, 900, onNext)
  return (
    <SignalFrame nodeId="743:22994" label="시그널 접속 중 — 클릭하면 건너뛰기" onClick={seq.onClick}>
      <TypeWriter
        className="sig-log"
        lines={LOG}
        startDelay={900}
        complete={seq.skipped}
        cursor="persist"
        onDone={seq.step(0)}
      />
    </SignalFrame>
  )
}

const TUNNEL = [
  [280, 174, 1361, 732, 6],
  [382, 234, 1155, 621, 6],
  [451, 271, 1017, 547, 6],
  [522, 302, 875, 471, 4],
  [571, 330, 779, 419, 4],
  [610, 356, 701, 377, 2],
  [644, 375, 633, 340, 2],
  [680, 392, 567, 305, 2],
  [700, 403, 527, 283, 2],
  [721, 410, 485, 260, 2],
] as const

/** Figma: 접속중 화면 2 (743:22598) */
export function Signal2({ onNext }: ScreenProps) {
  const seq = useSequence(3, 1200, onNext)
  const { stage, skipped } = seq
  return (
    <SignalFrame nodeId="743:22598" label="시그널 탐색 중 — 클릭하면 건너뛰기" onClick={seq.onClick}>
      {TUNNEL.map(([x, y, w, h, sw], i) => (
        <div
          key={i}
          className="tunnel__rect"
          style={{
            left: x,
            top: y,
            width: w,
            height: h,
            ['--w' as string]: `${sw}px`,
            ['--d' as string]: `${0.2 + i * 0.08}s`,
          }}
        />
      ))}
      <TypeWriter className="sig-log" lines={LOG} complete cursor="none" />
      <TypeWriter
        className="sig-wave"
        lines={['∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿', 'signal ))) ))) ))) detected']}
        startDelay={900}
        complete={skipped}
        onDone={seq.step(0)}
      />
      <TypeWriter
        className={`sig-lost${stage >= 2 || skipped ? ' signal-lost' : ''}`}
        lines={['c̶o̶n̶n̶e̶c̶t̶i̶n̶g̶...', '01001000 01000101 01010010', '▓▓▒▒░░ SIGNAL LOST ░░▒▒▓▓', '▓▒░ reconnecting... ░▒▓']}
        active={stage >= 1}
        startDelay={350}
        complete={skipped}
        onDone={seq.step(1)}
      />
      <TypeWriter
        className="sig-progress"
        lines={['CONNECTING  [██████████░░░░░░░░░░]  52%', 'CONNECTING  [████████████████████] 100%']}
        active={stage >= 2}
        startDelay={300}
        speed={40}
        linePause={500}
        complete={skipped}
        cursor="persist"
        onDone={seq.step(2)}
      />
    </SignalFrame>
  )
}

const WAVE = '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁'

/** Figma: 접속중 화면 3 (743:23377) — destination follows the entered era */
export function Signal3({ era, onNext }: ScreenProps & { era: Era }) {
  const seq = useSequence(2, 2600, onNext)
  const { stage, skipped } = seq
  const [shift, setShift] = useState(0)
  const live = stage >= 2 || skipped
  useEffect(() => {
    if (!live) return
    const t = window.setInterval(() => setShift((s) => (s + 1) % 14), 90)
    return () => window.clearInterval(t)
  }, [live])
  const wave = WAVE.slice(shift) + WAVE.slice(1, shift + 1)

  return (
    <SignalFrame nodeId="743:23377" label={`${era.anchorYear} ${era.city} 접속 — 클릭하면 계속`} onClick={seq.onClick}>
      <img className="planet" src={planet} alt="" />
      <TypeWriter
        className="sig-destination"
        lines={[
          `DESTINATION ── ${era.anchorYear} · ${era.city}`,
          `COORDINATES ── ${era.coordinates}`,
          'STATUS ─────── LOCKED ✓',
        ]}
        startDelay={1400}
        complete={skipped}
        onDone={seq.step(0)}
      />
      {live ? (
        <div className="typewriter sig-receiving" aria-label="receiving signal from her">
          <div className="typewriter__line">{wave}</div>
          <div className="typewriter__line">
            <span className="receiving__dots">···</span> receiving signal from her{' '}
            <span className="receiving__dots">···</span>
          </div>
        </div>
      ) : (
        <TypeWriter
          className="sig-receiving"
          lines={[WAVE, '··· receiving signal from her ···']}
          active={stage >= 1}
          startDelay={400}
          cursor="none"
          onDone={seq.step(1)}
        />
      )}
    </SignalFrame>
  )
}
