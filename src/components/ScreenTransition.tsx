import { useEffect, useState, type ReactNode } from 'react'
import { AsciiBurst } from './AsciiBurst'
import './ScreenTransition.css'

export type TransitionKind = 'slide' | 'fade' | 'crt' | 'ascii'

type Props<K extends string> = {
  screen: K
  render: (screen: K) => ReactNode
  /** How the *next* change animates. */
  kind?: TransitionKind
  /** ms — keep in sync with ScreenTransition.css */
  duration?: number
}

/**
 * Screen changes: 'slide' is a vertical camera move (the continuous scroll of
 * the Figma flow); 'fade' is a quick dissolve for screens that share a layout;
 * 'crt' powers the old screen off like a monitor and boots the next one on black;
 * 'ascii' swaps screens under a burst of flickering terminal glyphs.
 */
export function ScreenTransition<K extends string>({ screen, render, kind = 'slide', duration = 1300 }: Props<K>) {
  const [shown, setShown] = useState<{ keys: K[]; kind: TransitionKind }>({
    keys: [screen],
    kind,
  })

  // Derive layers during render when the screen changes (no effect loop).
  const current = shown.keys[shown.keys.length - 1]
  if (current !== screen) {
    setShown({ keys: [current, screen], kind })
  }

  useEffect(() => {
    if (shown.keys.length < 2) return
    const t = window.setTimeout(() => setShown((s) => ({ ...s, keys: [s.keys[s.keys.length - 1]] })), duration)
    return () => window.clearTimeout(t)
  }, [shown.keys, duration])

  const moving = shown.keys.length > 1
  return (
    <>
      {moving && shown.kind === 'crt' && <div key={`veil-${shown.keys[1]}`} className="screen-veil" aria-hidden />}
      <div className={`screens${moving && shown.kind === 'slide' ? ' screens--clip' : ''}`}>
        {shown.keys.map((key, i) => {
          const state = shown.keys.length === 1 ? 'idle' : i === 0 ? 'leaving' : 'entering'
          return (
            <div
              key={key}
              className={`screen screen--${state} screen--${shown.kind}`}
              aria-hidden={state === 'leaving' || undefined}
            >
              <div className="screen__inner">{render(key)}</div>
            </div>
          )
        })}
      </div>
      {shown.kind === 'ascii' && shown.keys.length > 1 && <AsciiBurst key={shown.keys[1]} />}
    </>
  )
}
