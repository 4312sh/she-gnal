import { useEffect, useRef } from 'react'
import { playSfx, type Sfx } from './sfx'

/** 화면에 들어와 잠시 뒤 소리 — 화면을 떠나면 잦아든다 */
export function useSfxOnMount(name: Sfx, delay = 0) {
  useEffect(() => {
    let stop = () => {}
    const t = window.setTimeout(() => {
      stop = playSfx(name)
    }, delay)
    return () => {
      window.clearTimeout(t)
      stop()
    }
  }, [name, delay])
}

/** 조건이 처음 참이 될 때 한 번 */
export function useSfxWhen(on: boolean, name: Sfx, delay = 0) {
  const fired = useRef(false)
  useEffect(() => {
    if (!on || fired.current) return
    const t = window.setTimeout(() => {
      fired.current = true
      playSfx(name)
    }, delay)
    return () => window.clearTimeout(t)
  }, [on, name, delay])
}
