import { useEffect, useRef } from 'react'
import consoleTopRaw from '../../assets/dashboard/console-top.svg?raw'

/**
 * 시간대 설정 · 세팅 준비 — 움직이는 부분
 *
 *   ConsoleTop    위 콘솔(판 · 궤도 9겹 · 행성 · 옆 선). Figma SVG 를 그대로 인라인으로 깔고
 *                 궤도 · 행성만 묶어서 움직인다.
 *                   궤도   안쪽부터 바깥쪽으로 빛이 번져 나가는 물결 (신호가 퍼지는 느낌)
 *                   행성   천천히 떠오르고 가라앉음 + 표면에서 둥근 파동이 퍼져 나감
 *                   입자   궤도 두 개를 따라 도는 작은 빛
 *   DistanceWave  왼쪽 아래 DISTANCE 카드의 선 그래프 — 왼쪽으로 흘러가는 신호 파형
 *
 * active (좌표가 다 들어온 뒤 · 세팅 준비 화면) 이면 조금 더 빠르고 크게 움직인다.
 * 움직임 줄이기 설정이면 멈춘 그림 그대로.
 */

type Part = { x: number; y: number; w: number; h: number; d?: string; body: string }

/** Figma SVG 를 조각(바로 아래 <svg>)으로 나눈다 */
function splitConsole(raw: string) {
  const open = raw.indexOf('>') + 1
  const close = raw.lastIndexOf('</svg>')
  const inner = raw.slice(open, close)
  const parts: Part[] = []
  const re = /<svg\b[^>]*\bx="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)"[^>]*>[\s\S]*?<\/svg>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(inner))) {
    const body = m[0]
    const d = /<path d="([^"]+)" stroke="#CFFFF5"/.exec(body)?.[1]
    parts.push({ x: Number(m[1]), y: Number(m[2]), w: Number(m[3]), h: Number(m[4]), d, body })
  }
  return parts
}

/** 조각 하나를 따로 된 그림으로 — 그림자 번짐이 잘리지 않게 둘레를 조금 남긴다 */
const PAD = 40
function layer(p: Part) {
  const vx = p.x - PAD
  const vy = p.y - PAD
  const w = p.w + PAD * 2
  const h = p.h + PAD * 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vx} ${vy} ${w} ${h}" fill="none">${p.body}</svg>`
  return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, left: vx, top: vy, width: w, height: h }
}

const PARTS = splitConsole(consoleTopRaw)
const RINGS = PARTS.filter((p) => p.d).sort((a, b) => a.w - b.w)
const PLANET = PARTS.find((p) => p.body.includes('<circle'))
const FRAME = PARTS.filter((p) => !p.d && p !== PLANET)

const FRAME_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" fill="none">${FRAME.map((p) => p.body).join('')}</svg>`,
)}`
const RING_LAYERS = RINGS.map(layer)
const PLANET_LAYER = PLANET ? layer(PLANET) : null

/** 행성 가운데 (Figma 846.97 + 110.7, 222.67 + 110.7) */
const PX = 957.7
const PY = 333.4

/** 궤도를 도는 빛 — 안쪽에서 네 번째 · 일곱 번째 · 아홉 번째 */
const ORBITERS = [
  { ring: 3, dur: 9, size: 5, delay: 0 },
  { ring: 6, dur: 14, size: 4.4, delay: -5 },
  { ring: 8, dur: 19, size: 3.6, delay: -11 },
]

/*
 * 성능 — 궤도마다 그림자 번짐(필터)이 있어서 한 SVG 안에서 움직이면 매 프레임 번짐을 다시 그린다.
 * 그래서 조각마다 따로 된 그림(<img>)으로 깔고 투명도 · 위치만 바꾼다 (GPU 합성만, 다시 그리기 없음).
 */
export function ConsoleTop({ active = false }: { active?: boolean }) {
  return (
    <div className={`art console-top${active ? ' is-active' : ''}`} aria-hidden>
      <img className="ct-layer" src={FRAME_SRC} alt="" style={{ left: 0, top: 0, width: 1920, height: 1080 }} />
      {RING_LAYERS.map((l, i) => (
        <img
          key={i}
          className="ct-layer ct-ring"
          src={l.src}
          alt=""
          style={{ left: l.left, top: l.top, width: l.width, height: l.height, ['--i' as string]: i }}
        />
      ))}
      {ORBITERS.map(({ ring, dur, size, delay }) => {
        const p = RINGS[ring]
        if (!p?.d) return null
        return (
          <span key={ring} className="ct-orbit" style={{ left: p.x, top: p.y }}>
            <i
              className="ct-dot"
              style={{
                width: size,
                height: size,
                offsetPath: `path("${p.d}")`,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
              }}
            />
          </span>
        )
      })}
      <span className="ct-wave" style={{ left: PX - 111, top: PY - 111 }} />
      <span className="ct-wave ct-wave--2" style={{ left: PX - 111, top: PY - 111 }} />
      {PLANET_LAYER && (
        <img
          className="ct-layer ct-planet"
          src={PLANET_LAYER.src}
          alt=""
          style={{ left: PLANET_LAYER.left, top: PLANET_LAYER.top, width: PLANET_LAYER.width, height: PLANET_LAYER.height }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------------
 * DISTANCE 선 그래프 (Figma 102.87, 924.06 · 401×63)
 * --------------------------------------------------------------------- */

const W = 401
const H = 63
const BASE = 61
const STEP = 4

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/** t 초에서의 파형 — 낮은 물결 몇 겹 + 왼쪽에서 오른쪽으로 지나가는 봉우리 하나 */
function wavePath(t: number, gain: number) {
  const pts: string[] = []
  const peak = ((t * 46) % (W + 160)) - 80
  for (let x = 0; x <= W; x += STEP) {
    const env = smooth(0, 60, x) * smooth(W, W - 30, x)
    const ripple =
      7 * Math.sin(x * 0.034 - t * 1.3) + 4.5 * Math.sin(x * 0.087 + t * 2.1) + 2.5 * Math.sin(x * 0.19 - t * 3.2)
    const spike = 38 * Math.exp(-((x - peak) ** 2) / (2 * 13 ** 2))
    const h = env * (20 + gain * (ripple + spike))
    const y = Math.max(2, Math.min(BASE, BASE - h))
    pts.push(`${x === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join('')
}

export function DistanceWave({ active = false }: { active?: boolean }) {
  const line = useRef<SVGPathElement>(null)
  const fill = useRef<SVGPathElement>(null)
  const gain = useRef(active ? 1.25 : 1)

  useEffect(() => {
    const target = active ? 1.25 : 1
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const draw = (t: number) => {
      gain.current += (target - gain.current) * 0.04
      const d = wavePath(t, gain.current)
      line.current?.setAttribute('d', d)
      fill.current?.setAttribute('d', `${d}L${W} ${H}L0 ${H}Z`)
    }
    if (reduce) {
      draw(2.4)
      return
    }
    let raf = 0
    const start = performance.now()
    let last = 0
    const tick = (now: number) => {
      // 30fps 면 충분하다 — 화면 전체 부담을 줄인다
      if (now - last > 32) {
        last = now
        draw((now - start) / 1000 + 2.4)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])

  const init = wavePath(2.4, gain.current)
  return (
    <svg
      className="distance-wave"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      overflow="visible"
      aria-hidden
    >
      <defs>
        <linearGradient id="distance-wave-fill" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#BFA0FE" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#3354F4" stopOpacity="0.45" />
          <stop offset="1" stopColor="#3354F4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path ref={fill} d={`${init}L${W} ${H}L0 ${H}Z`} fill="url(#distance-wave-fill)" />
      <path ref={line} d={init} stroke="#3354F4" strokeWidth="3.9" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
