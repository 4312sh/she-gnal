import { useEffect, useState } from 'react'
import './AsciiBurst.css'

const CHARS = '▓▒░█#%&@/\\|<>{}[]01=+*:;.'
const COLS = 160
const ROWS = 38

function noise() {
  let s = ''
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) s += Math.random() < 0.55 ? ' ' : CHARS[(Math.random() * CHARS.length) | 0]
    s += '\n'
  }
  return s
}

/** Full-stage flicker of random ASCII glyphs, shown between VM-style screens. */
export function AsciiBurst() {
  const [text, setText] = useState(noise)
  useEffect(() => {
    const t = window.setInterval(() => setText(noise()), 55)
    return () => window.clearInterval(t)
  }, [])
  return (
    <pre className="ascii-burst" aria-hidden>
      {text}
    </pre>
  )
}
