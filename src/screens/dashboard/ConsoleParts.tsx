import type { ReactNode } from 'react'
import { FIELDS, segText } from './fields'

/** Top console art (panel, orbit rings, planet, side lines) — shared by setup & ready. 움직임은 ConsoleMotion */
export { ConsoleTop, DistanceWave } from './ConsoleMotion'

/** Label boxes + displays + AM/PM row. `renderDisplay` lets setup make them interactive. */
export function TimeRow({
  pm,
  onPm,
  renderDisplay,
}: {
  pm: boolean
  onPm?: (pm: boolean) => void
  renderDisplay: (f: (typeof FIELDS)[number]) => ReactNode
}) {
  return (
    <>
      {FIELDS.map((f) => (
        <div key={f.key} className="dash-label" style={{ left: f.labelX, top: 573, width: 196, height: 45 }}>
          {f.label}
        </div>
      ))}
      {FIELDS.map((f) => renderDisplay(f))}
      <button
        type="button"
        className={`ampm${!pm ? ' is-on' : ''}`}
        style={{ left: 1148, top: 638 }}
        onClick={() => onPm?.(false)}
        disabled={!onPm}
        aria-pressed={!pm}
      >
        AM
      </button>
      <button
        type="button"
        className={`ampm${pm ? ' is-on' : ''}`}
        style={{ left: 1148, top: 697 }}
        onClick={() => onPm?.(true)}
        disabled={!onPm}
        aria-pressed={pm}
      >
        PM
      </button>
    </>
  )
}

export function SegDisplay({
  field,
  raw,
  focused,
  onFocus,
  readOnly,
}: {
  field: (typeof FIELDS)[number]
  raw: string
  focused?: boolean
  onFocus?: () => void
  readOnly?: boolean
}) {
  return (
    <div
      className={`seg${focused ? ' is-focused' : ''}`}
      style={{
        left: field.x,
        top: 638,
        width: field.w,
        cursor: readOnly ? 'default' : undefined,
      }}
      role={readOnly ? undefined : 'textbox'}
      aria-label={field.label}
      onClick={onFocus}
      data-field={field.key}
    >
      <span className="seg__ghost">{field.ghost}</span>
      <span className="seg__value">{segText(field.key, raw)}</span>
      {focused && raw.length < field.max && <span className="seg__caret" />}
    </div>
  )
}

export function Level({
  tone,
  x,
  value,
  strong = false,
}: {
  tone: 'pink' | 'blue' | 'grey'
  x: number
  value: number
  /** 세팅 준비 화면: 채움 색이 더 진하다 (Figma 1259:30282) */
  strong?: boolean
}) {
  return (
    <div className={`level level--${tone}${strong ? ' level--strong' : ''}`} style={{ left: x, top: 98 }}>
      <div className="level__fill" style={{ height: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

/** 오른쪽 위 게이지 두 개 + PWR / SYNK 라벨과 퍼센트 (Figma 1259:30763 · 1259:30282) */
export function Gauges({ pwr, synk, strong = false }: { pwr: number; synk: number; strong?: boolean }) {
  const pct = (v: number) => `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`
  return (
    <>
      <span className="gauge-label" style={{ left: 1603, top: 107 }}>PWR</span>
      <span className="gauge-label" style={{ left: 1603, top: 161 }}>{pct(pwr)}</span>
      <span className="gauge-label" style={{ left: 1706, top: 107 }}>SYNK</span>
      <span className="gauge-label" style={{ left: 1706, top: 161 }}>{pct(synk)}</span>
      <Level tone="pink" x={1646} value={pwr} strong={strong} />
      <Level tone="blue" x={1751} value={synk} strong={strong} />
    </>
  )
}

/** 왼쪽 위 NOW / TARGET 칸 — 시간대 설정 · 세팅 준비 공용 */
export function NowTarget({ now, target, live = false }: { now: string; target: string; live?: boolean }) {
  return (
    <>
      <div className="dash-label dash-label--r8 dash-label--small" style={{ left: 130, top: 98, width: 68, height: 45 }}>
        NOW
      </div>
      <div className="readout" style={{ left: 223, top: 98, width: 211, height: 45 }}>
        {now}
      </div>
      <div className="dash-label dash-label--r8 dash-label--small" style={{ left: 130, top: 161, width: 68, height: 45 }}>
        TARGET
      </div>
      <div className={`readout${live ? ' readout--live' : ''}`} style={{ left: 223, top: 161, width: 211, height: 45 }}>
        {target}
      </div>
    </>
  )
}
