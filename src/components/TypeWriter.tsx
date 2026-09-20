import { useEffect, useMemo, useRef, useState } from 'react'
import './TypeWriter.css'

type Props = {
  lines: string[]
  /** Start typing when true (lets screens chain several writers). */
  active?: boolean
  /** Render everything immediately (click-to-skip). */
  complete?: boolean
  /** Base ms per character. */
  speed?: number
  /** Extra pause at the end of each line. */
  linePause?: number
  startDelay?: number
  /** Blinking block cursor: while typing only, or keep it after finishing. */
  cursor?: 'typing' | 'persist' | 'none'
  onDone?: () => void
  className?: string
}

const GLITCH = '▓▒░█#%&@/\\|<>01'

// Split into user-perceived characters so combining marks (c̶o̶n̶…) stay with their base.
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const graphemes = (s: string) => Array.from(segmenter.segment(s), (x) => x.segment)

function delayFor(ch: string, speed: number) {
  const jitter = 0.6 + Math.random() * 0.8
  if (ch === '.' || ch === '·') return speed * 0.45 * jitter
  if (/[█░▒▓▁▂▃▄▅▆▇∿─]/.test(ch)) return speed * 0.55 * jitter
  if (ch === ' ') return speed * 0.8 * jitter
  return speed * jitter
}

/**
 * Terminal-style typing: characters appear one by one with a flickering
 * "glitch" glyph at the write head, like an ASCII console receiving a signal.
 * Untyped text is laid out invisibly so nothing reflows while typing.
 */
export function TypeWriter({
  lines,
  active = true,
  complete = false,
  speed = 28,
  linePause = 260,
  startDelay = 0,
  cursor = 'typing',
  onDone,
  className,
}: Props) {
  const split = useMemo(() => lines.map(graphemes), [lines])
  const total = useMemo(() => split.reduce((n, l) => n + l.length, 0), [split])
  const [count, setCount] = useState(0)
  const [glitch, setGlitch] = useState('')
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  const shown = complete ? total : count
  const finished = shown >= total

  // typing loop
  useEffect(() => {
    if (!active || complete || count >= total) return
    // find the char about to be typed and whether it ends a line
    let rest = count
    let li = 0
    while (li < split.length && rest >= split[li].length) {
      rest -= split[li].length
      li++
    }
    const ch = split[li]?.[rest] ?? ''
    const atLineEnd = rest === split[li].length - 1
    const wait = (count === 0 ? startDelay : 0) + delayFor(ch, speed) + (atLineEnd ? linePause : 0)
    const t = window.setTimeout(() => setCount((c) => c + 1), wait)
    return () => window.clearTimeout(t)
  }, [active, complete, count, total, split, speed, linePause, startDelay])

  // flickering glyph at the write head
  useEffect(() => {
    if (!active || finished) return
    const t = window.setInterval(() => setGlitch(GLITCH[(Math.random() * GLITCH.length) | 0]), 45)
    return () => window.clearInterval(t)
  }, [active, finished])

  useEffect(() => {
    if (finished && !doneRef.current && (active || complete)) {
      doneRef.current = true
      onDoneRef.current?.()
    }
  }, [finished, active, complete])

  // how many characters of each line are visible, and which line holds the write head
  const perLine: number[] = []
  split.reduce((left, chars) => {
    perLine.push(Math.min(left, chars.length))
    return left - Math.min(left, chars.length)
  }, shown)
  const headLine = perLine.findIndex((n, i) => n < split[i].length)

  return (
    <div className={`typewriter${className ? ` ${className}` : ''}`} aria-label={lines.join('\n')}>
      {split.map((chars, i) => {
        const n = perLine[i]
        const isHeadLine = i === headLine
        const isLastLine = i === split.length - 1
        const showCursor =
          (cursor === 'typing' && isHeadLine && active && !finished) ||
          (cursor === 'persist' && ((isHeadLine && active) || (finished && isLastLine)))
        return (
          <div className="typewriter__line" key={i} aria-hidden>
            <span>{chars.slice(0, n).join('')}</span>
            {isHeadLine && active && !finished && n > 0 && <span className="typewriter__glitch">{glitch}</span>}
            {showCursor && <span className="typewriter__cursor">▌</span>}
            <span className="typewriter__ghost">
              {chars.slice(n + (isHeadLine && active && n > 0 ? 1 : 0)).join('')}
            </span>
          </div>
        )
      })}
    </div>
  )
}
