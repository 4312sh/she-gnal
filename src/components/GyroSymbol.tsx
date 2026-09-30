import { useEffect, useRef, useState, type ReactNode } from 'react'
import './GyroSymbol.css'

/*
 * 타이틀 가운데 심볼 (Figma 743:30036, 950.748 × 577, 아트보드 left 485 / top 106)
 *
 * idle   : 링들이 각자 다른 축으로 3D 회전 (웹2.mov 느낌)
 * locked : 현재 각도에서 Figma 정지 포즈로 감속하며 맞물림 → onSettled 호출
 *
 * 링은 3D 원을 정사영(orthographic)한 타원으로 그림.
 * 좌표는 모두 심볼 로컬 좌표(viewBox 0 0 950.748 577).
 */

type Quat = [number, number, number, number] // w, x, y, z
type Vec3 = [number, number, number]

const W = 950.748
const H = 577
const CX = 475.35
const CY = 288.5
const R = 249.7
const DEG = Math.PI / 180

// ---------- 쿼터니언 ----------
const qAxis = (ax: Vec3, a: number): Quat => {
  const s = Math.sin(a / 2)
  return [Math.cos(a / 2), ax[0] * s, ax[1] * s, ax[2] * s]
}
const qMul = (a: Quat, b: Quat): Quat => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
]
const qDot = (a: Quat, b: Quat) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
const qRot = (q: Quat, v: Vec3): Vec3 => {
  const [w, x, y, z] = q
  // t = 2 * (q.xyz × v)
  const tx = 2 * (y * v[2] - z * v[1])
  const ty = 2 * (z * v[0] - x * v[2])
  const tz = 2 * (x * v[1] - y * v[0])
  return [
    v[0] + w * tx + (y * tz - z * ty),
    v[1] + w * ty + (z * tx - x * tz),
    v[2] + w * tz + (x * ty - y * tx),
  ]
}
/** t > 1 도 허용(오버슈트용 외삽) */
const qSlerp = (a: Quat, b: Quat, t: number): Quat => {
  let d = qDot(a, b)
  let bb = b
  if (d < 0) {
    d = -d
    bb = [-b[0], -b[1], -b[2], -b[3]]
  }
  if (d > 0.9995) {
    const r: Quat = [0, 1, 2, 3].map((i) => a[i] + (bb[i] - a[i]) * t) as Quat
    const n = Math.hypot(...r)
    return r.map((v) => v / n) as Quat
  }
  const om = Math.acos(Math.min(1, d))
  const s = Math.sin(om)
  const ka = Math.sin((1 - t) * om) / s
  const kb = Math.sin(t * om) / s
  return [0, 1, 2, 3].map((i) => a[i] * ka + bb[i] * kb) as Quat
}

const X: Vec3 = [1, 0, 0]
const Y: Vec3 = [0, 1, 0]
const Z: Vec3 = [0, 0, 1]

/** 수평 링을 앞으로 e만큼 기울인 자세 (투영 높이 = 2r·sin e) */
const flat = (e: number) => qAxis(X, Math.PI / 2 - e)

/**
 * 원은 자기 법선 축 회전·앞뒤 뒤집기를 해도 같은 모양.
 * 그중 현재 자세와 가장 가까운 목표를 골라서 락 걸 때 쓸데없이 빙글 돌지 않게 함.
 */
function nearestEquivalent(from: Quat, target: Quat): Quat {
  let best = target
  let bestDot = -1
  for (const flip of [0, Math.PI]) {
    for (let i = 0; i < 48; i++) {
      const cand = qMul(target, qMul(qAxis(X, flip), qAxis(Z, (i / 48) * Math.PI * 2)))
      const d = Math.abs(qDot(from, cand))
      if (d > bestDot) {
        bestDot = d
        best = cand
      }
    }
  }
  return best
}

// ---------- 링 정의 ----------
type Ring = {
  id: string
  r: number
  cls: string
  /** Figma 정지 포즈 */
  target: Quat
  /** idle 회전: q(t) = A(w1 t + p1) · B(w2 t + p2) · target */
  spin: [Vec3, number, number, Vec3, number, number]
  delay: number // 락 스태거(ms)
}

const RINGS: Ring[] = [
  // 굵은 X 링 두 개 (743:30006 / 743:30007)
  {
    id: 'thickA', r: 251, cls: 'gy-thick',
    target: qMul(qAxis(Z, 45 * DEG), flat(11.5 * DEG)),
    spin: [[0.3, 1, 0.2], 0.55, 0.4, [1, 0, 0.3], 0.37, 1.1], delay: 0,
  },
  {
    id: 'thickB', r: 251, cls: 'gy-thick',
    target: qMul(qAxis(Z, -45 * DEG), flat(11.5 * DEG)),
    spin: [[1, 0.4, 0], 0.43, 2.2, [0, 0.3, 1], 0.29, 0.3], delay: 90,
  },
  // 얇은 대각선(모서리로 보이는 링, 743:30004)
  {
    id: 'thinDiag', r: 248, cls: 'gy-thin',
    target: qMul(qAxis(Z, -46 * DEG), qAxis(X, Math.PI / 2)),
    spin: [[0.2, 0.2, 1], 0.33, 0.9, [1, 0.6, 0], 0.51, 2.6], delay: 180,
  },
  // 가운데 원판 (743:30002)
  {
    id: 'disk', r: 171.3, cls: 'gy-disk',
    target: flat(23.65 * DEG),
    spin: [[0, 0, 1], 0.27, 0.2, [1, 0, 0.15], 0.19, 0.3], delay: 120,
  },
  // 경선 (743:30005, 743:30008) : 지구본처럼 세로축으로 회전
  {
    id: 'merA', r: R, cls: 'gy-mer',
    target: qAxis(Y, 46.48 * DEG),
    spin: [Y, 0.35, 0, Y, 0, 0], delay: 240,
  },
  {
    id: 'merB', r: R, cls: 'gy-mer',
    target: qAxis(Y, 77.49 * DEG),
    spin: [Y, 0.35, 1.3, Y, 0, 0], delay: 280,
  },
]

const normalize = (v: Vec3): Vec3 => {
  const n = Math.hypot(...v)
  return [v[0] / n, v[1] / n, v[2] / n]
}

function idlePose(ring: Ring, t: number): Quat {
  const [a1, w1, p1, a2, w2, p2] = ring.spin
  return qMul(qMul(qAxis(normalize(a1), w1 * t + p1), qAxis(normalize(a2), w2 * t + p2)), ring.target)
}

/** 3D 원 → 2D 타원(cx, cy, rx, ry, 회전각°) */
function project(q: Quat, r: number) {
  const u = qRot(q, [r, 0, 0])
  const v = qRot(q, [0, r, 0])
  const a = u[0], b = v[0], c = u[1], d = v[1]
  const E = (a + d) / 2, F = (a - d) / 2, G = (c + b) / 2, Hh = (c - b) / 2
  const Q = Math.hypot(E, Hh)
  const Rr = Math.hypot(F, G)
  const a1 = Math.atan2(G, F)
  const a2 = Math.atan2(Hh, E)
  return {
    rx: Q + Rr,
    ry: Math.max(0.01, Math.abs(Q - Rr)), // 0이면 SVG가 안 그림
    rot: ((a2 + a1) / 2) / DEG,
    u, v,
  }
}

// ---------- 이징 ----------
const easeOutBack = (t: number, s = 1.25) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

const LOCK_MS = 1400
const SETTLE_MS = LOCK_MS + 280 + 200 // 마지막 링 스태거 + 여유

type Props = {
  locked: boolean
  /** 락 모션이 끝났을 때 */
  onSettled?: () => void
  /** 선택: 락이 끝나면 교차 페이드할 Figma 정지 심볼 */
  children?: ReactNode
  className?: string
}

export function GyroSymbol({ locked, onSettled, children, className }: Props) {
  const [settled, setSettled] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const lockedRef = useRef(locked)
  const onSettledRef = useRef(onSettled)

  useEffect(() => {
    lockedRef.current = locked
    onSettledRef.current = onSettled
  }, [locked, onSettled])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const els = Object.fromEntries(
      RINGS.map((r) => [r.id, svg.querySelector<SVGEllipseElement>(`[data-ring="${r.id}"]`)!]),
    )
    const dot = svg.querySelector<SVGCircleElement>('[data-dot]')!
    const outer = svg.querySelector<SVGEllipseElement>('[data-outer]')!
    const diskFill = svg.querySelector<SVGEllipseElement>('[data-ring="disk"]')!
    // 원판 색: 영상 속 어두운 갈색 → Figma 배경색(#1c1a1f)
    const diskColor = (k: number) => {
      const a = [0x12, 0x0f, 0x0c], b = [0x1c, 0x1a, 0x1f]
      return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`
    }

    const start = performance.now()
    let raf = 0
    let lockStart: number | null = null
    let lockFrom: Quat[] = []
    let lockTo: Quat[] = []
    let dotFrom: [number, number] = [CX, CY]
    let settledFired = false

    const draw = (ring: Ring, q: Quat) => {
      const p = project(q, ring.r)
      const el = els[ring.id]
      el.setAttribute('rx', p.rx.toFixed(2))
      el.setAttribute('ry', p.ry.toFixed(2))
      el.setAttribute('transform', `rotate(${p.rot.toFixed(3)} ${CX} ${CY})`)
      return p
    }

    const frame = (now: number) => {
      const t = (now - start) / 1000

      if (lockedRef.current && lockStart === null) {
        // 락 시작: 지금 자세를 저장하고 가장 가까운 목표 자세 계산
        lockStart = now
        lockFrom = RINGS.map((r) => idlePose(r, t))
        lockTo = RINGS.map((r, i) => nearestEquivalent(lockFrom[i], r.target))
        const pA = project(lockFrom[0], RINGS[0].r)
        const s = t * 0.9
        dotFrom = [CX + pA.u[0] * Math.cos(s) + pA.v[0] * Math.sin(s), CY + pA.u[1] * Math.cos(s) + pA.v[1] * Math.sin(s)]
      }
      if (!lockedRef.current && lockStart !== null) {
        // 다시 idle로 (보통 안 씀)
        lockStart = null
        settledFired = false
        setSettled(false)
      }

      if (lockStart === null) {
        // ---- idle ----
        let thickA: ReturnType<typeof project> | null = null
        RINGS.forEach((r) => {
          const p = draw(r, idlePose(r, t))
          if (r.id === 'thickA') thickA = p
        })
        // 굵은 링 A 위를 도는 점
        const s = t * 0.9
        const pA = thickA!
        dot.setAttribute('cx', (CX + pA.u[0] * Math.cos(s) + pA.v[0] * Math.sin(s)).toFixed(2))
        dot.setAttribute('cy', (CY + pA.u[1] * Math.cos(s) + pA.v[1] * Math.sin(s)).toFixed(2))
        dot.setAttribute('r', '9')
        outer.style.opacity = '0'
        diskFill.style.fill = diskColor(0)
      } else {
        // ---- lock ----
        const el = now - lockStart
        RINGS.forEach((r, i) => {
          const k = easeOutBack(clamp01((el - r.delay) / LOCK_MS))
          draw(r, qSlerp(lockFrom[i], lockTo[i], k))
        })
        // 점은 가운데로 빨려 들어가 중심점이 됨
        const kd = easeOutCubic(clamp01(el / 900))
        dot.setAttribute('cx', (dotFrom[0] + (CX - dotFrom[0]) * kd).toFixed(2))
        dot.setAttribute('cy', (dotFrom[1] + (CY - dotFrom[1]) * kd).toFixed(2))
        dot.setAttribute('r', (9 + (12.75 - 9) * kd).toFixed(2))
        // 바깥 큰 타원이 펼쳐짐
        const ko = easeOutCubic(clamp01((el - 350) / 1000))
        outer.style.opacity = String(ko)
        outer.setAttribute('rx', (R + (375.45 - R) * ko).toFixed(2))
        diskFill.style.fill = diskColor(easeOutCubic(clamp01(el / 800)))

        if (!settledFired && el >= SETTLE_MS) {
          settledFired = true
          setSettled(true)
          onSettledRef.current?.()
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={['gyro', settled && 'is-settled', children && 'has-final', className].filter(Boolean).join(' ')}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="gyro-svg">
        {/* 구 안쪽은 배경색으로 채움 (Figma와 동일: 뒤 그리드가 가려짐) */}
        <circle className="gy-sphere-bg" cx={CX} cy={CY} r={R} />
        {/* 가운데 원판은 뒤쪽 (축·링이 위로 지나가게) */}
        <ellipse data-ring="disk" className="gy-disk" cx={CX} cy={CY} rx={171.3} ry={171.3} />

        {/* 고정 요소: 축 · 대각 점선 */}
        <g className="gy-axis">
          <line x1={CX} y1={4} x2={CX} y2={H - 4} />
          <line x1={4} y1={CY} x2={W - 4} y2={CY} />
        </g>
        <g className="gy-diag">
          <line x1={144} y1={163} x2={806.8} y2={414.5} />
          <line x1={144} y1={414.5} x2={806.8} y2={163} />
        </g>
        <g className="gy-tip">
          {[
            [CX, 4], [CX, H - 4], [4, CY], [W - 4, CY],
            [144, 163], [806.8, 414.5], [144, 414.5], [806.8, 163],
          ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.6} />)}
        </g>

        {/* 바깥 큰 타원 (락 때 펼쳐짐, 743:30034) */}
        <ellipse data-outer className="gy-outer" cx={CX} cy={CY} rx={R} ry={250} />

        {/* 구 외곽 · 위아래 위선 (고정) */}
        <circle className="gy-sphere" cx={CX} cy={CY} r={R} />
        <ellipse className="gy-lat" cx={CX} cy={109.1} rx={172.1} ry={26} />
        <ellipse className="gy-lat" cx={CX} cy={468.1} rx={172.1} ry={26} />

        {/* 움직이는 링 */}
        {RINGS.filter((r) => r.id !== 'disk').map((r) => (
          <ellipse key={r.id} data-ring={r.id} className={r.cls} cx={CX} cy={CY} rx={r.r} ry={r.r} />
        ))}

        {/* 도는 점 → 중심점 */}
        <circle data-dot className="gy-dot" cx={CX} cy={CY} r={9} />
      </svg>
      {children && <div className="gyro-final">{children}</div>}
    </div>
  )
}
