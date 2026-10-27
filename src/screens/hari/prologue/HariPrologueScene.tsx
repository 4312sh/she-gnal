import { useEffect, useRef, useState } from 'react'

import city from '../../../assets/hari/prologue/prologue-city.webp'
import stageBg from '../../../assets/hari/prologue/prologue-stage.webp'
import hariBlink from '../../../assets/hari/prologue/hari-prologue-blink.webp'
import hariThink from '../../../assets/hari/prologue/hari-prologue-think.webp'
import hariSmile from '../../../assets/hari/prologue/hari-prologue-smile.webp'
import hariChoice from '../../../assets/hari/prologue/hari-prologue-choice.webp'

/**
 * 하리 프롤로그 — 배경 · 인물
 *
 *   city   1373:41150  image 23 — 도시 야경 (받은 원본 3840×2160, 흐림이 그림에 들어가 있다)
 *   stage  1508:14711  배경 디자인 1 — 무대 (받은 원본 3840×2160, 흐림이 그림에 들어가 있다)
 *   그 위에 difference 막 (1373:41151 · 1508:14712)
 *   공간이동 때 두 배경을 겹쳐 두고 무대 쪽을 서서히 올린다.
 */

export type PrologueRoom = 'city' | 'stage'

/** 2026 대기실 이야기의 하리 몸짓 그림 — 2023 이야기도 같은 하리라 같이 쓴다 */
export const DEBUT_POSES = { blink: hariBlink, think: hariThink, smile: hariSmile, choice: hariChoice }

/**
 * 여러 공간을 겹쳐 두고 지금 공간만 서서히 올리는 배경 (화면 전체 1920×1080 그림)
 * 첫 칸이 맨 아래에 늘 깔리고, 나머지는 지금 공간일 때만 보인다.
 */
export function RoomBackdrop({ rooms, room }: { rooms: { id: string; src: string }[]; room: string }) {
  return (
    <>
      {rooms.map((r, i) => (
        <div key={r.id} className={`hp-bg hp-bg--room${i === 0 || r.id === room ? ' is-on' : ''}`} aria-hidden>
          <img src={r.src} alt="" />
        </div>
      ))}
      <div className="hp-diff" aria-hidden />
    </>
  )
}

export function PrologueBackdrop({ room }: { room: PrologueRoom }) {
  return (
    <>
      <div className="hp-bg hp-bg--city" aria-hidden data-node-id="1373:41150">
        <img src={city} alt="" />
      </div>
      <div className={`hp-bg hp-bg--stage${room === 'stage' ? ' is-on' : ''}`} aria-hidden data-node-id="1508:14711">
        <img src={stageBg} alt="" />
      </div>
      <div className={`hp-diff${room === 'stage' ? ' hp-diff--stage' : ''}`} aria-hidden />
    </>
  )
}

/**
 * 하리의 몸짓 (원본 8000×6079 캔버스를 1370×1041 로 — Figma 1484:14467 자리)
 *   blink  기본 · 유저가 입력하는 동안 — 눈 깜빡임
 *   think  생각중 — 가슴에 손 → 손바닥 내밀며 팔 움직임
 *   smile  하리가 말할 때 — 턱 괴고 키득키득 → 바라봄
 *   choice 선택지를 고르는 동안 — 가만히 · 깜빡 → 가슴에 손 → 손바닥 내밀며 말하기 (hari2-gesture 와 같은 순서)
 * 세 그림 모두 같은 자르기 · 같은 배율이라 바꿔도 몸 위치가 그대로다.
 *
 * 몸짓이 바뀌면 그 그림을 처음부터 다시 돌린다. 브라우저는 주소가 같은 움직이는 그림을 한 시계로 돌려서
 * <img> 를 새로 그려도 중간부터 이어지므로, 한 번 받아 둔 파일로 매번 새 blob 주소를 만든다.
 */
export type HariPose = 'blink' | 'think' | 'smile' | 'choice'

const SRC: Record<HariPose, string> = DEBUT_POSES

export function HariMotion({
  pose,
  fading = false,
  sources = SRC,
}: {
  pose: HariPose
  fading?: boolean
  /** 몸짓별 그림 — 없는 몸짓은 눈 깜빡임으로 */
  sources?: Partial<Record<HariPose, string>>
}) {
  const src = (k: HariPose) => sources[k] ?? sources.blink ?? SRC.blink
  const blobs = useRef<Partial<Record<HariPose, Blob>>>({})
  const [layers, setLayers] = useState<{ key: number; pose: HariPose; url: string; on: boolean }[]>([
    { key: 0, pose, url: src(pose), on: true },
  ])
  const n = useRef(0)

  // 세 그림을 미리 받아 둔다
  useEffect(() => {
    let alive = true
    ;(Object.keys(sources) as HariPose[]).forEach((k) => {
      fetch(src(k))
        .then((r) => r.blob())
        .then((b) => {
          if (alive) blobs.current[k] = b
        })
        .catch(() => {})
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLayers((ls) => {
      const top = ls[ls.length - 1]
      if (top && top.pose === pose) return ls
      n.current += 1
      const b = blobs.current[pose]
      const url = b ? URL.createObjectURL(b) : src(pose)
      // 바로 앞 그림만 남겨 겹쳐 사라지게 하고, 그보다 오래된 건 치운다
      ls.slice(0, -1).forEach((l) => l.url.startsWith('blob:') && URL.revokeObjectURL(l.url))
      return [...(top ? [{ ...top, on: false }] : []), { key: n.current, pose, url, on: true }]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose])

  useEffect(
    () => () => {
      setLayers((ls) => {
        ls.forEach((l) => l.url.startsWith('blob:') && URL.revokeObjectURL(l.url))
        return ls
      })
    },
    [],
  )

  return (
    <div className={`hp-figure${fading ? ' is-fading' : ''}`} aria-hidden data-node-id="1484:14467">
      {layers.map((l) => (
        <img key={l.key} className={`hp-figure__img${l.on ? ' is-on' : ' is-leaving'}`} src={l.url} alt="" />
      ))}
    </div>
  )
}
