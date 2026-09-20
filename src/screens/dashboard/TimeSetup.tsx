import { useEffect, useMemo, useRef, useState } from 'react'
import bottom from '../../assets/dashboard/setup-bottom.svg'
import {
  daysBetween,
  formatNow,
  formatTarget,
  isValidTarget,
  nearestEra,
  toDate,
  TOTAL_ORBITS,
  type TargetTime,
} from '../../game/eras'
import { ConsoleTop, Level, SegDisplay, TimeRow } from './ConsoleParts'
import { FIELDS, rawFromTarget, type FieldKey } from './fields'
import './Dashboard.css'
import './TimeSetup.css'

type Props = {
  initial?: TargetTime
  onGo: (target: TargetTime) => void
  onBack: () => void
}

/** Figma: "main dashboard - 시간대 진입 설정" (743:23769) */
export function TimeSetup({ initial, onGo, onBack }: Props) {
  const [raw, setRaw] = useState<Record<FieldKey, string>>(() => rawFromTarget(initial))
  const [pm, setPm] = useState(initial?.pm ?? true)
  const [focus, setFocus] = useState<number>(0)
  const [now, setNow] = useState(() => new Date())
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(t)
  }, [])

  // one keyboard handler on the console; `focus` says which display receives digits
  const focusRef = useRef(focus)
  const rawRef = useRef(raw)
  useEffect(() => {
    focusRef.current = focus
  }, [focus])
  useEffect(() => {
    const t = window.setTimeout(() => rootRef.current?.focus({ preventScroll: true }), 80)
    return () => window.clearTimeout(t)
  }, [])

  const partial: Partial<TargetTime> = {
    month: raw.month ? Number(raw.month) : undefined,
    day: raw.day ? Number(raw.day) : undefined,
    year: raw.year.length === 4 ? Number(raw.year) : undefined,
    hour: raw.hour ? Number(raw.hour) : undefined,
    minute: raw.minute.length === 2 ? Number(raw.minute) : undefined,
    pm,
  }
  const target = isValidTarget(partial) ? partial : null
  const complete = FIELDS.filter((f) => raw[f.key].length === f.max).length / FIELDS.length

  const era = useMemo(() => (target ? nearestEra(target.year) : null), [target])
  const distance = target ? daysBetween(now, toDate(target)) : null
  const drift = target ? (target.year - now.getFullYear()).toFixed(1) : null

  const handleKey = (e: React.KeyboardEvent) => {
    const i = focusRef.current
    const f = FIELDS[i]
    const cur0 = rawRef.current
    const commit = (value: string) => {
      rawRef.current = { ...rawRef.current, [f.key]: value }
      setRaw(rawRef.current)
    }
    const move = (to: number) => {
      const n = Math.max(0, Math.min(FIELDS.length - 1, to))
      focusRef.current = n
      setFocus(n)
    }
    if (/^\d$/.test(e.key)) {
      e.preventDefault()
      // ref copy so fast typing continues correctly into the next display
      const cur = cur0[f.key].length >= f.max ? '' : cur0[f.key]
      const next = cur + e.key
      commit(next)
      if (next.length >= f.max && i < FIELDS.length - 1) move(i + 1)
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      if (!cur0[f.key] && i > 0) move(i - 1)
      else commit(cur0[f.key].slice(0, -1))
    } else if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey && i < FIELDS.length - 1)) {
      e.preventDefault()
      move(i + 1)
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey && i > 0)) {
      e.preventDefault()
      move(i - 1)
    } else if (e.key.toLowerCase() === 'a') {
      setPm(false)
    } else if (e.key.toLowerCase() === 'p') {
      setPm(true)
    } else if (e.key === 'Enter' && target) {
      e.preventDefault()
      onGo(target)
    }
  }

  const status = target
    ? '▲ TEMPORAL LOCK READY'
    : complete > 0
      ? '· · · reading coordinates · · ·'
      : '· · · awaiting coordinates · · ·'

  return (
    <div className="dash time-setup" ref={rootRef} tabIndex={-1} onKeyDown={handleKey} data-node-id="743:23769">
      <>
        <ConsoleTop />
        <img className="art" src={bottom} alt="" />

        {/* top-left readouts */}
        <div
          className="dash-label dash-label--r8 dash-label--small"
          style={{ left: 130, top: 98, width: 68, height: 45 }}
        >
          NOW
        </div>
        <div className="readout" style={{ left: 223, top: 98, width: 211, height: 45 }}>
          {formatNow(now)}
        </div>
        <div
          className="dash-label dash-label--r8 dash-label--small"
          style={{ left: 130, top: 161, width: 68, height: 45 }}
        >
          TARGET
        </div>
        <div
          className={`readout${target ? ' readout--live' : ''}`}
          style={{ left: 223, top: 161, width: 211, height: 45 }}
        >
          {target ? formatTarget(target).replace('  ', ' ') : '----.--.--  --:--'}
        </div>

        {/* side readouts on the horizontal lines */}
        <div className="side-readout" style={{ left: 131, top: 342, width: 223 }}>
          {'TIME DRIFT\n'}
          <b>{drift ? `${Number(drift) > 0 ? '+' : ''}${drift} yrs` : '--.- yrs'}</b>
        </div>
        <div className="side-readout" style={{ left: 1579, top: 342, width: 223 }}>
          {'SIGNAL FREQ\n'}
          <b>{era ? `${(88 + era.orbit * 2.7).toFixed(1)} MHz` : '---.- MHz'}</b>
        </div>

        {/* level gauges: completeness (pink) / sync (blue) */}
        <Level tone="pink" x={1646} value={0.15 + complete * 0.85} />
        <Level tone="blue" x={1751} value={target ? 1 : complete * 0.5} />

        <TimeRow
          pm={pm}
          onPm={setPm}
          renderDisplay={(f) => {
            const i = FIELDS.indexOf(f)
            return (
              <SegDisplay
                key={f.key}
                field={f}
                raw={raw[f.key]}
                focused={focus === i}
                onFocus={() => {
                  focusRef.current = i
                  setFocus(i)
                }}
              />
            )
          }}
        />

        {/* bottom-left: distance card */}
        <span className="card-label" style={{ left: 158, top: 833 }}>
          DISTANCE
        </span>
        <span className="card-value" style={{ left: 337, top: 831 }}>
          {distance !== null ? `${distance.toLocaleString('en-US')} days` : '--,--- days'}
        </span>

        {/* bottom-right: orbit card */}
        <div className="card-note" style={{ left: 1413, top: 800, width: 180 }}>
          {era
            ? `ORBIT  ${String(era.orbit).padStart(2, '0')} / ${String(TOTAL_ORBITS).padStart(2, '0')}\nLAYER  ${era.layer}`
            : 'ORBIT  -- / 09\nLAYER  ----'}
        </div>
        <div
          className={`card-note card-note--status${target ? ' is-ready' : ''}`}
          style={{ left: 1413, top: 973, width: 340 }}
        >
          {status}
        </div>

        {/* actions */}
        <button
          type="button"
          className="dash-pill time-setup__go"
          style={{ left: 728, top: 846, width: 464, height: 96 }}
          disabled={!target}
          onClick={() => target && onGo(target)}
        >
          GO
        </button>
        <button
          type="button"
          className="dash-pill time-setup__back"
          style={{ left: 728, top: 969, width: 464, height: 74 }}
          onClick={onBack}
        >
          back
        </button>
      </>
    </div>
  )
}
