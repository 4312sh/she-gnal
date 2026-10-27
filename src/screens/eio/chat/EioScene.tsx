import { useEffect, useRef, useState } from 'react'

import forest from '../../../assets/character/future/eio-forest.jpg'
import studio from '../../../assets/character/future/eio-bg.jpg'
import eioSway from '../../../assets/character/future/eio-sway.webp'
import eioWave from '../../../assets/character/future/eio-wave.webp'
import eioShake from '../../../assets/character/future/eio-shake.webp'
import type { EioScene } from './eioPrologueScript'

/**
 * 이오 프롤로그 — 배경 · 인물
 *
 *   forest  1373:41124  미래 2@3x — 숲 (원본 5761×3241 을 1920×1080 으로, blur 3)
 *   studio  1563:20531  하늘색 그래픽 (대시보드 배경과 같은 그림, 2003×1127 · blur 5)
 *   공간이동 때 두 배경을 겹쳐 두고 스튜디오 쪽을 서서히 올린다.
 */
export function EioBackdrop({ scene }: { scene: EioScene }) {
  return (
    <>
      <div className="ec-bg ec-bg--forest" aria-hidden data-node-id="1373:41124">
        <img src={forest} alt="" />
      </div>
      <div className={`ec-bg ec-bg--studio${scene === 'studio' ? ' is-on' : ''}`} aria-hidden data-node-id="1563:20531">
        <img src={studio} alt="" />
      </div>
    </>
  )
}

/**
 * 이오의 몸짓 — 블렌더 렌더 루프 세 개 (557×918, 투명 배경, 같은 구도)
 *   sway   기본 · 이오가 말할 때 · 선택지
 *   wave   유저가 입력하는 동안 · 생각중
 *   shake  고대어를 못 알아들었을 때
 *
 * 크기는 장면마다 다르다 (Figma) — 같은 그림을 위쪽 가운데를 기준으로 키운다.
 *   base    557×918  top 162   (1492:14550)
 *   answer  803×1323 top 135   (1359:40068 · 1563:20530) — 가까이 다가와 말한다
 *   choice  599×988  top 111   (1564:20557)
 *
 * 몸짓이 바뀌면 그 그림을 처음부터 다시 돌린다 (주소가 같으면 브라우저가 중간부터 이어 돌려서 blob 주소를 새로 만든다).
 */
export type EioMotionKind = 'sway' | 'wave' | 'shake'
export type EioFrame = 'base' | 'answer' | 'choice'

const SRC: Record<EioMotionKind, string> = { sway: eioSway, wave: eioWave, shake: eioShake }
const KINDS = Object.keys(SRC) as EioMotionKind[]

export function EioMotion({ motion, frame, fading = false }: { motion: EioMotionKind; frame: EioFrame; fading?: boolean }) {
  const blobs = useRef<Partial<Record<EioMotionKind, Blob>>>({})
  const [layers, setLayers] = useState<{ key: number; motion: EioMotionKind; url: string; on: boolean }[]>([
    { key: 0, motion, url: SRC[motion], on: true },
  ])
  const n = useRef(0)

  useEffect(() => {
    let alive = true
    KINDS.forEach((k) => {
      fetch(SRC[k])
        .then((r) => r.blob())
        .then((b) => {
          if (alive) blobs.current[k] = b
        })
        .catch(() => {})
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    setLayers((ls) => {
      const top = ls[ls.length - 1]
      if (top && top.motion === motion) return ls
      n.current += 1
      const b = blobs.current[motion]
      const url = b ? URL.createObjectURL(b) : SRC[motion]
      ls.slice(0, -1).forEach((l) => l.url.startsWith('blob:') && URL.revokeObjectURL(l.url))
      return [...(top ? [{ ...top, on: false }] : []), { key: n.current, motion, url, on: true }]
    })
  }, [motion])

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
    <div className={`ec-figure is-${frame}${fading ? ' is-fading' : ''}`} aria-hidden>
      {layers.map((l) => (
        <img key={l.key} className={`ec-figure__img${l.on ? ' is-on' : ' is-leaving'}`} src={l.url} alt="" />
      ))}
    </div>
  )
}

/** 채팅 기록에 쓰는 그림 */
export { eioSway as EIO_HISTORY_FIGURE }
