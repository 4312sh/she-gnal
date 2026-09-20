import { useEffect, useState, type ReactNode } from 'react'
import './Stage.css'

export const STAGE_WIDTH = 1920
export const STAGE_HEIGHT = 1080

function getScale() {
  return Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT)
}

type Props = {
  children: ReactNode
  /** Colour of the area outside the 16:9 artboard on non-16:9 monitors. */
  tone?: 'grid' | 'black'
}

/**
 * 1920×1080 artboard (the Figma frame size), scaled to fit any monitor ("contain").
 * Screens position elements in Figma pixel units; the stage itself does not clip,
 * so full-bleed layers (grid, veils) can extend past the artboard to fill
 * ultrawide / 16:10 / portrait displays, while screen content is clipped by
 * ScreenTransition.
 */
export function Stage({ children, tone = 'grid' }: Props) {
  const [scale, setScale] = useState(getScale)

  useEffect(() => {
    const onResize = () => setScale(getScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className={`stage-viewport stage-viewport--${tone}`}>
      <div
        className="stage"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
