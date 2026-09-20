import { useEffect, useRef, useState } from 'react'
import dome from '../../assets/dashboard/ready-dome.svg'
import gaugeSvg from '../../assets/dashboard/gauge.svg?raw'
import { formatTarget, nearestEra, type TargetTime } from '../../game/eras'
import { ConsoleTop, Level, SegDisplay, TimeRow } from './ConsoleParts'
import { rawFromTarget } from './fields'
import './Dashboard.css'
import './TimeReady.css'

type Props = {
  target: TargetTime
  onDone: () => void
}

/** Ticks (not the two big arcs or the needle) in left→right order. */
const ARC_IDS = new Set(['Vector', 'Vector_2', 'Vector_3'])
const FILL_MS = 3200
const HOLD_MS = 900

/** Figma: "main dashboard - 시간대 진입 입력 완료 후 세팅 준비" (743:22133) */
export function TimeReady({ target, onDone }: Props) {
  const gaugeRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState(0)
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  })

  const era = nearestEra(target.year)
  const raw = rawFromTarget(target)

  // order the gauge ticks by x and stagger their light-up
  useEffect(() => {
    const svg = gaugeRef.current?.querySelector('svg')
    if (!svg) return
    const ticks = Array.from(svg.querySelectorAll<SVGPathElement>('path[id]')).filter((p) => !ARC_IDS.has(p.id))
    ticks
      .map((p) => ({ p, x: p.getBBox().x }))
      .sort((a, b) => a.x - b.x)
      .forEach(({ p }, i, all) => {
        p.classList.add('gauge-tick')
        p.style.animationDelay = `${0.5 + (i / all.length) * (FILL_MS / 1000)}s`
      })
    svg.querySelector('#Vector')?.classList.add('gauge-arc', 'gauge-arc--left')
    svg.querySelector('#Vector_2')?.classList.add('gauge-arc', 'gauge-arc--right')
    svg.querySelector('#Vector_3')?.classList.add('gauge-needle')
  }, [])

  useEffect(() => {
    const start = performance.now() + 500
    let raf = 0
    const tick = (t: number) => {
      const p = Math.max(0, Math.min(1, (t - start) / FILL_MS))
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const d = window.setInterval(() => setDots((n) => (n + 1) % 4), 380)
    const done = window.setTimeout(() => doneRef.current(), 500 + FILL_MS + HOLD_MS)
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(d)
      window.clearTimeout(done)
    }
  }, [])

  return (
    <div className="dash time-ready" data-node-id="743:22133" onClick={() => progress >= 1 && doneRef.current()}>
      <>
        <img className="art art--bleed" src={dome} alt="" />
        <div
          className="time-ready__gauge"
          ref={gaugeRef}
          // SVG exported from Figma (trusted local asset) — inlined so each tick can animate
          dangerouslySetInnerHTML={{ __html: gaugeSvg }}
        />
        <ConsoleTop />

        <div className="readout time-ready__bar" style={{ left: 130, top: 98, width: 304, height: 45 }}>
          {`TARGET  ${formatTarget(target).replace('  ', ' ')}`}
        </div>
        <div className="readout time-ready__bar" style={{ left: 130, top: 172, width: 304, height: 45 }}>
          {`${era.layer} · ${era.city}`}
        </div>

        <p className="time-ready__status">
          now connecting{'.'.repeat(dots)}
          <span className="time-ready__pct">{String(Math.round(progress * 100)).padStart(3, ' ')}%</span>
        </p>

        <Level tone="grey" x={1677} value={0.48 + progress * 0.52} />
        <Level tone="grey" x={1746} value={0.48 + Math.max(0, progress - 0.25) * 0.69} />

        <TimeRow pm={target.pm} renderDisplay={(f) => <SegDisplay key={f.key} field={f} raw={raw[f.key]} readOnly />} />
      </>
    </div>
  )
}
