import type { ReactNode } from 'react'
import consoleTop from '../../assets/dashboard/console-top.svg'
import { FIELDS, segText } from './fields'

/** Top console art (panel, orbit rings, planet, side lines) — shared by setup & ready. */
export function ConsoleTop() {
  return <img className="art planet-pulse" src={consoleTop} alt="" />
}

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

export function Level({ tone, x, value }: { tone: 'pink' | 'blue' | 'grey'; x: number; value: number }) {
  return (
    <div className={`level level--${tone}`} style={{ left: x, top: 98 }}>
      <div className="level__fill" style={{ height: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}
