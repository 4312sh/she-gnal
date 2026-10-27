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
import { destinationFor, nearestDestination, type Destination } from '../../game/destinations'
import { ConsoleTop, DistanceWave, Gauges, NowTarget, SegDisplay, TimeRow } from './ConsoleParts'
import { FIELDS, rawFromTarget, type FieldKey } from './fields'
import { playSfx } from '../../game/sfx'
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
  /** 대화가 없는 연도로 GO 했을 때 — 가까운 연도로 옮길지 묻는 경고창 */
  const [jump, setJump] = useState<{ from: number; to: Destination } | null>(null)
  /** 경고창에서 YES — 연도를 바꿔 보여 준 뒤 출발 */
  const [jumping, setJumping] = useState(false)

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

  /** 좌표가 맞아 출발할 수 있게 되면 한 번 울린다 */
  const lockReady = Boolean(target && destinationFor(target.year))
  const wasReady = useRef(lockReady)
  useEffect(() => {
    if (lockReady && !wasReady.current) playSfx('lock')
    wasReady.current = lockReady
  }, [lockReady])

  /** 버튼 위에 올라갈 때 한 번만 */
  const hovered = useRef<Element | null>(null)

  const launch = (t: TargetTime) => {
    playSfx('engage')
    onGo(t)
  }

  /** 그 연도에 채팅이 있으면 바로 출발, 없으면 경고창 */
  const tryGo = (t: TargetTime) => {
    if (jumping) return
    if (destinationFor(t.year)) launch(t)
    else {
      playSfx('alert')
      setJump({ from: t.year, to: nearestDestination(t.year) })
    }
  }

  const confirmJump = () => {
    if (!jump || !target) return
    const year = jump.to.year
    const moved: Partial<TargetTime> = { ...target, year }
    const next: TargetTime = isValidTarget(moved) ? moved : { ...target, year, day: 28 } // 2월 29일 → 28일
    rawRef.current = { ...rawRef.current, year: String(year), day: String(next.day).padStart(2, '0') }
    setRaw(rawRef.current)
    setJump(null)
    setJumping(true)
    playSfx('confirm')
    // 바뀐 연도가 계기판에 찍히는 걸 잠깐 보여 주고 출발
    window.setTimeout(() => launch(next), 1200)
  }

  const cancelJump = () => {
    playSfx('close')
    setJump(null)
    focusRef.current = 2 // YEAR
    setFocus(2)
    rootRef.current?.focus({ preventScroll: true })
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (jump) {
      if (e.key === 'Enter' || e.key.toLowerCase() === 'y') {
        e.preventDefault()
        confirmJump()
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'n') {
        e.preventDefault()
        cancelJump()
      }
      return
    }
    if (jumping) return
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
      playSfx('key', { pitch: i * 2 })
      commit(next)
      if (next.length >= f.max && i < FIELDS.length - 1) move(i + 1)
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      playSfx('erase')
      if (!cur0[f.key] && i > 0) move(i - 1)
      else commit(cur0[f.key].slice(0, -1))
    } else if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey && i < FIELDS.length - 1)) {
      e.preventDefault()
      playSfx('hover')
      move(i + 1)
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey && i > 0)) {
      e.preventDefault()
      playSfx('hover')
      move(i - 1)
    } else if (e.key.toLowerCase() === 'a') {
      if (pm) playSfx('click')
      setPm(false)
    } else if (e.key.toLowerCase() === 'p') {
      if (!pm) playSfx('click')
      setPm(true)
    } else if (e.key === 'Enter' && target) {
      e.preventDefault()
      tryGo(target)
    }
  }

  const status = target
    ? destinationFor(target.year)
      ? '▲ TEMPORAL LOCK READY'
      : '· · · no signal in this year · · ·'
    : complete > 0
      ? '· · · reading coordinates · · ·'
      : '· · · awaiting coordinates · · ·'

  return (
    <div className="dash time-setup" ref={rootRef} tabIndex={-1} onKeyDown={handleKey}
      onPointerOver={(e) => {
        const btn = (e.target as Element).closest('button:not(:disabled), .seg')
        if (btn && btn !== hovered.current) playSfx('hover')
        hovered.current = btn
      }}
      data-node-id="1259:30763"
    >
      <>
        <ConsoleTop active={Boolean(target)} />
        <img className="art" src={bottom} alt="" />

        {/* top-left readouts */}
        <NowTarget
          now={formatNow(now)}
          target={target ? formatTarget(target).replace('  ', ' ') : '----.--.--  --:--'}
          live={Boolean(target)}
        />

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
        {/* 처음엔 Figma 값 그대로 PWR 62% · SYNK 48%, 입력할수록 차오른다 */}
        <Gauges pwr={0.62 + complete * 0.38} synk={target ? 1 : 0.48 + complete * 0.2} />

        <TimeRow
          pm={pm}
          onPm={(v) => {
            if (v !== pm) playSfx('click')
            setPm(v)
          }}
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

        {/* bottom-left: distance card — 흘러가는 신호 파형 */}
        <div className="distance-wave-box" style={{ left: 102.87, top: 924.06 }}>
          <DistanceWave active={Boolean(target)} />
        </div>
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
          className={`card-note card-note--status${target && destinationFor(target.year) ? ' is-ready' : ''}`}
          style={{ left: 1413, top: 973, width: 340 }}
        >
          {status}
        </div>

        {/* actions */}
        <button
          type="button"
          className="dash-pill time-setup__go"
          style={{ left: 728, top: 846, width: 464, height: 96 }}
          disabled={!target || jumping}
          onClick={() => target && tryGo(target)}
        >
          GO
        </button>
        <button
          type="button"
          className="dash-pill time-setup__back"
          style={{ left: 728, top: 969, width: 464, height: 63 }}
          onClick={() => {
            playSfx('close')
            onBack()
          }}
        >
          back
        </button>

        {/* 대화가 없는 연도 — 가까운 연도로 옮길지 묻는다 */}
        {jump && (
          <div className="time-jump" role="alertdialog" aria-labelledby="time-jump-title" aria-describedby="time-jump-body">
            <div className="time-jump__panel">
              <p className="time-jump__title" id="time-jump-title">
                ✕ SIGNAL NOT FOUND
              </p>
              <p className="time-jump__body" id="time-jump-body">
                {'This era is unreachable.\nWould you like to travel to the nearest year instead?'}
              </p>
              <p className="time-jump__years">
                <span className="time-jump__from">{String(jump.from).padStart(4, '0')}</span>
                <span className="time-jump__arrow">──▶</span>
                <span className="time-jump__to">{jump.to.year}</span>
              </p>
              <div className="time-jump__actions">
                <button type="button" className="dash-pill time-jump__yes" onClick={confirmJump} autoFocus>
                  {`yes, go to ${jump.to.year}`}
                </button>
                <button type="button" className="dash-pill time-jump__no" onClick={cancelJump}>
                  no
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  )
}
