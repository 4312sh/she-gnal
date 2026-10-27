/**
 * 캐릭터 프로필 사진 (동그란 아바타)
 *   졸업작품/과거/캐릭터 그래픽 · 현재/캐릭터 프로필 · 미래/캐릭터 프로필
 *
 * 목록 칸은 75px, 채팅 칸은 120px 이라 두 배 크기를 쓴다 — sm 150px · lg 240px
 * 스토리마다 그 시기의 얼굴을 고른다 (Figma 1343:36290 · 1454:1261 · 1462:2683 · 1335:35165 · 1455:2031)
 */
import past1913sm from '../../assets/avatars/past/1913-1918-sm.png'
import past1913 from '../../assets/avatars/past/1913-1918.png'
import past1919sm from '../../assets/avatars/past/1919-1927-sm.png'
import past1919 from '../../assets/avatars/past/1919-1927.png'
import past1928sm from '../../assets/avatars/past/1928-1934-sm.png'
import past1928 from '../../assets/avatars/past/1928-1934.png'
import past1935sm from '../../assets/avatars/past/1935-1948-sm.png'
import past1935 from '../../assets/avatars/past/1935-1948.png'
import preDebutSm from '../../assets/avatars/present/pre-debut-sm.png'
import preDebut from '../../assets/avatars/present/pre-debut.png'
import onCameraSm from '../../assets/avatars/present/on-camera-sm.png'
import onCamera from '../../assets/avatars/present/on-camera.png'
import offCameraSm from '../../assets/avatars/present/off-camera-sm.png'
import offCamera from '../../assets/avatars/present/off-camera.png'
import eioSm from '../../assets/avatars/future/eio-sm.png'
import eio from '../../assets/avatars/future/eio.png'

export type AvatarImage = { sm: string; lg: string }

/** 나혜석 — 시기별 */
export const HYESEOK = {
  y1913: { sm: past1913sm, lg: past1913 },
  y1919: { sm: past1919sm, lg: past1919 },
  y1928: { sm: past1928sm, lg: past1928 },
  y1935: { sm: past1935sm, lg: past1935 },
} satisfies Record<string, AvatarImage>

/** 반하리 — 데뷔 전 · 데뷔 후(카메라 앞 / 뒤) */
export const HARI = {
  preDebut: { sm: preDebutSm, lg: preDebut },
  onCamera: { sm: onCameraSm, lg: onCamera },
  offCamera: { sm: offCameraSm, lg: offCamera },
} satisfies Record<string, AvatarImage>

export const EIO: AvatarImage = { sm: eioSm, lg: eio }

/** 나혜석 스토리 → 얼굴. 첫 조우는 Figma 대로 1928–1934 단발 */
const PAST_BY_STORY: Record<string, AvatarImage> = {
  prologue: HYESEOK.y1928,
  ch1: HYESEOK.y1913, // 1914
  firstLove: HYESEOK.y1913, // 1916
  march1: HYESEOK.y1919, // 1919
  ch2: HYESEOK.y1919, // 1920
}

/** 반하리 스토리 → 얼굴. 2020 연습생은 데뷔 전, 2024 는 카메라 뒤 */
const PRESENT_BY_STORY: Record<string, AvatarImage> = {
  prologue: HARI.onCamera, // 2026 공연장 뒷편의 대기실
  '2020': HARI.preDebut,
  '2023': HARI.onCamera,
  '2024': HARI.offCamera,
}

/** 시대 기본 얼굴 (스토리를 모를 때) */
export const ERA_AVATAR = {
  past: HYESEOK.y1928,
  present: HARI.onCamera,
  future: EIO,
} satisfies Record<'past' | 'present' | 'future', AvatarImage>

export function storyAvatar(era: 'past' | 'present' | 'future', storyId: string): AvatarImage {
  if (era === 'past') return PAST_BY_STORY[storyId] ?? ERA_AVATAR.past
  if (era === 'present') return PRESENT_BY_STORY[storyId] ?? ERA_AVATAR.present
  return EIO
}
