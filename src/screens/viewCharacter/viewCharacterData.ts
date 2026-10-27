import { loadHistory, type HistoryKey, type HistorySession } from '../../game/chatHistory'
import type { Player } from '../../game/types'
import { STORY_ENTRIES, STORY_ROWS } from '../character/characterData'
import { ERAS as HYESEOK_PERIODS } from '../character/timelineData'
import { EIO_STORIES } from '../eio/eioData'
import { HARI_HISTORY_KEY, HARI_STORIES, HARI_STORY_DETAIL } from '../hari/hariData'
import { EIO, ERA_AVATAR, HARI, HYESEOK, storyAvatar, type AvatarImage } from './avatars'
import eioFigure from '../../assets/character/future/eio-sway.webp'
import past1913 from '../../assets/view-character/figures/past-1913.webp'
import past1919 from '../../assets/view-character/figures/past-1919.webp'
import past1928 from '../../assets/view-character/figures/past-1928.webp'
import past1935 from '../../assets/view-character/figures/past-1935.webp'
import hariPreDebut from '../../assets/view-character/figures/present-predebut.webp'
import hariDebut from '../../assets/view-character/figures/present-debut.webp'
import hariBackstage from '../../assets/view-character/figures/present-backstage.webp'

/**
 * View charactor 화면 데이터 (Figma 1288:33279 외 9장)
 *
 * /…/ 로 감싼 문구는 Figma 자리표시 그대로다.
 * 가운데 캐릭터(figure)는 상반신 움직이는 webp — 정지 그림(jpg · png)으로 받은 것은 같은 구도로 잘라 webp 로 만들었다
 * 목록 · 채팅 아바타는 스토리마다 그 시기의 프로필 사진을 쓴다 (avatars.ts)
 */

export type EraKey = 'past' | 'present' | 'future'

export const ERA_ORDER: EraKey[] = ['past', 'present', 'future']

/** 캐릭터 상태 한 칸 — 이름 · 가운데 그래픽 · 프로필 사진 */
export type Look = {
  label: string
  /** 가운데 상반신 그래픽 */
  figure: string
  /** 같은 시기의 동그란 프로필 사진 (avatars.ts) */
  avatar: AvatarImage
  /** 시대 화면 대시보드 줄: WORK · MARITAL · RELATION */
  work: string
  marital: string
  relation: string
  /** 시대 화면 아래 키워드 4칸 */
  keywords: string[]
}

/**
 * 상태별 WORK · MARITAL · RELATION · 키워드 — 시나리오가 정해지기 전까지 임의로 넣은 값
 *   RELATION 은 그 시기 그녀가 플레이어를 어떻게 여기는지
 */
type LookInfo = Pick<Look, 'work' | 'marital' | 'relation' | 'keywords'>

const PAST_INFO: LookInfo[] = [
  // 1913–1918 · 도쿄 유학
  { work: 'student', marital: 'single', relation: '흥미로운 이방인', keywords: ['바다 건너의 교실', '아껴 쓴 물감', '돌아오라는 전보', '현모양처를 의심하다'] },
  // 1919–1927 · 3·1 운동 · 결혼 · 첫 개인전
  { work: 'painter', marital: 'married', relation: '말이 통하는 사람', keywords: ['3·1 운동', '네 가지 조건', '신문에 낸 혼인', '첫 개인전'] },
  // 1928–1934 · 유럽 여행 · 이혼
  { work: 'painter', marital: 'divorced', relation: '비밀을 아는 친구', keywords: ['파리의 화실', '유럽 여행', '이혼고백장', '네 아이를 두고'] },
  // 1935–1948 · 팔리지 않는 그림
  { work: 'painter', marital: 'divorced', relation: '마지막 말벗', keywords: ['팔리지 않는 그림', '수덕사의 겨울', '병에 걸리다', '끝까지 붓을 놓지 않다'] },
]

const PRESENT_INFO: LookInfo[] = [
  // 데뷔 전 · 2020 연습생
  { work: 'trainee', marital: 'single', relation: '새벽 연습실의 낯선 사람', keywords: ['월말평가', '독기 충만', '엄마 몰래 둔 문제집', '데뷔조'] },
  // 데뷔 후 · 카메라 앞
  { work: 'idol', marital: 'single', relation: '카메라 밖의 친구', keywords: ['첫 음악방송', '엄마 패딩', '팬사인회', '1위 공약'] },
  // 카메라 뒤 · 스케줄 끝난 새벽
  { work: 'idol', marital: 'single', relation: '유일한 대화 상대', keywords: ['새벽 스케줄', '텅 빈 숙소', '잘 안 와닿는 말', '잘 자요'] },
]

const FUTURE_INFO: LookInfo[] = [
  // 이오 · 2999
  { work: 'companion unit', marital: 'n/a', relation: '첫 번째 사용자', keywords: ['감정 모듈', '기억 저장소', '이름의 의미', '2999'] },
]

export type Profile = {
  /** /charactor name/ 칸 */
  name: string
  /** 캐릭터 상태 목록 (드롭다운 옆 상자) — 고른 것이 /state/ 칸과 가운데 그래픽이 된다 */
  looks: Look[]
}

/**
 * CHARACTOR ▾ 옆 "캐릭터 상태" 목록
 *   과거 — 나혜석 시기 4개 (캐릭터 화면 타임라인의 연도 구분 그대로: 1913–1918 / 1919–1927 / 1928–1934 / 1935–1948)
 *   현재 — 반하리 3개 (데뷔 전 · 데뷔 후 · 카메라 뒤)
 *   미래 — 이오 1개
 */
const PAST_FIGURES = [past1913, past1919, past1928, past1935]
const PAST_AVATARS = [HYESEOK.y1913, HYESEOK.y1919, HYESEOK.y1928, HYESEOK.y1935]
const PAST_LOOKS: Look[] = HYESEOK_PERIODS.map((p, i) => ({
  label: `${p.from} – ${p.to}`,
  figure: PAST_FIGURES[i],
  avatar: PAST_AVATARS[i],
  ...PAST_INFO[i],
}))
const PRESENT_LOOKS: Look[] = [
  { label: '데뷔 전', figure: hariPreDebut, avatar: HARI.preDebut, ...PRESENT_INFO[0] },
  { label: '데뷔 후', figure: hariDebut, avatar: HARI.onCamera, ...PRESENT_INFO[1] },
  { label: '카메라 뒤', figure: hariBackstage, avatar: HARI.offCamera, ...PRESENT_INFO[2] },
]
const FUTURE_LOOKS: Look[] = [{ label: '이오', figure: eioFigure, avatar: EIO, ...FUTURE_INFO[0] }]

export const PROFILES: Record<EraKey, Profile> = {
  past: {
    name: '나혜석',
    looks: PAST_LOOKS,
  },
  present: {
    name: '반하리',
    looks: PRESENT_LOOKS,
  },
  future: {
    name: '이오',
    looks: FUTURE_LOOKS,
  },
}

/* ───────── Story timeline ───────── */

export type TimelineItem = {
  id: string
  title: string
  /** 목록 둘째 줄 (Prologue · 1914 …) */
  sub: string
  /** 오른쪽 제목 칩 — "도쿄 유학길 | 1914" */
  heading: string
  /** 오른쪽 요약 (줄 단위) */
  summary: string[]
  /** 오른쪽 해금 요소 4칸 — null 이면 /캐릭터 해금 요소/ */
  unlocks: (string | null)[]
  /** 목록 아바타 — 그 스토리 시기의 얼굴 */
  avatar: AvatarImage
}

const pad4 = (xs: string[]): (string | null)[] => [...xs.slice(0, 4), null, null, null, null].slice(0, 4)

const pastTimeline: TimelineItem[] = STORY_ROWS.filter((r) => !r.locked).map((r) => {
  const entry = STORY_ENTRIES[r.id]
  return {
    id: r.id,
    title: r.title,
    sub: r.year,
    heading: `${r.title} | ${r.year}`,
    summary: entry ? entry.poem : ['/채팅 스토리 요약/'],
    unlocks: pad4(entry ? entry.buttons.map((b) => b.label) : []),
    avatar: storyAvatar('past', r.id),
  }
})

const presentTimeline: TimelineItem[] = HARI_STORIES.map((s) => ({
  id: s.id,
  title: s.title,
  sub: s.label,
  heading: `${s.title} | ${s.label}`,
  summary: HARI_STORY_DETAIL[s.id].summary.length ? HARI_STORY_DETAIL[s.id].summary : ['/채팅 스토리 요약/'],
  unlocks: pad4([]),
  avatar: storyAvatar('present', s.id),
}))

const futureTimeline: TimelineItem[] = EIO_STORIES.filter((s) => !s.locked).map((s) => ({
  id: s.id,
  title: s.id === 'prologue' ? '첫 조우' : s.label,
  sub: s.id === 'prologue' ? 'Prologue' : s.label,
  heading: s.id === 'prologue' ? '첫 조우 | Prologue' : '/제목|년도/',
  summary: [s.summary || '/채팅 스토리 요약/'],
  unlocks: pad4([]),
  avatar: storyAvatar('future', s.id),
}))

export const TIMELINES: Record<EraKey, TimelineItem[]> = {
  past: pastTimeline,
  present: presentTimeline,
  future: futureTimeline,
}

/* ───────── Chat history ───────── */

export type ChatEntry = {
  key: string
  era: EraKey
  /** 목록 첫 줄 — 캐릭터 이름 */
  name: string
  /** 오른쪽 머리 — "첫 조우" + "prologue" */
  title: string
  label: string
  /** 마지막 대화 날짜 (yyyy.m.d) */
  at: string
  /** 마지막으로 기록한 시각 (ms, 없으면 0) */
  ts: number
  sessions: HistorySession[]
  /** 그 스토리 시기의 얼굴 — 목록 · 채팅 아바타 */
  avatar: AvatarImage
}

type ChatSlot = { key: HistoryKey; storyId: string; title: string; label: string }

const PAST_CHATS: ChatSlot[] = [
  { key: 'prologue', storyId: 'prologue', title: '첫 조우', label: 'prologue' },
  { key: 'ch1', storyId: 'ch1', title: '도쿄 유학길', label: '1914' },
  { key: 'ch2', storyId: 'ch2', title: '네 가지 조건', label: '1920' },
]

const PRESENT_CHATS: ChatSlot[] = HARI_STORIES.flatMap((s) => {
  const key = HARI_HISTORY_KEY[s.id]
  return key ? [{ key, storyId: s.id, title: s.title, label: s.label }] : []
})

/** 이오 — 지금은 프롤로그 대화만 있다 */
const FUTURE_CHATS: ChatSlot[] = [{ key: 'eioPrologue', storyId: 'prologue', title: '고대 신호', label: 'prologue' }]

/** yyyy.m.d → 정렬용 숫자 */
const dateNum = (at: string) => {
  const [y, m, d] = at.split('.').map((n) => Number(n) || 0)
  return y * 10000 + m * 100 + d
}

/** 저장된 대화 기록을 모아 최근 순으로. 대화가 없는 칸은 뺀다 */
export function loadChats(): ChatEntry[] {
  const collect = (era: EraKey, list: ChatSlot[]) =>
    list.flatMap(({ key, storyId, title, label }) => {
      const sessions = loadHistory(key)
      if (!sessions.length) return []
      const at = sessions[sessions.length - 1].at
      // 같은 날이면 마지막으로 기록한 시각으로 (예전 기록엔 시각이 없어 날짜만)
      const ts = Math.max(0, ...sessions.map((s) => s.ts ?? 0))
      return [{ key, era, name: PROFILES[era].name, title, label, at, ts, sessions, avatar: storyAvatar(era, storyId) }]
    })
  return [...collect('past', PAST_CHATS), ...collect('present', PRESENT_CHATS), ...collect('future', FUTURE_CHATS)].sort(
    (a, b) => dateNum(b.at) - dateNum(a.at) || b.ts - a.ts,
  )
}

/** 가장 최근에 대화를 나눈 캐릭터 — 기록이 없으면 마지막 접속 시대, 그것도 없으면 과거 */
export function recentEra(player: Partial<Player>, chats: ChatEntry[]): EraKey {
  if (chats.length) return chats[0].era
  const id = player.lastPlayed?.eraId
  return id === 'present' || id === 'future' ? id : 'past'
}

/** LAST SHEGNAL 옆 날짜 */
export function lastDate(player: Partial<Player>, chats: ChatEntry[]): string | undefined {
  return chats[0]?.at ?? player.lastPlayed?.at
}

/**
 * 시대마다 처음 보여 줄 캐릭터 상태 — 그 시대에서 가장 최근에 나눈 대화의 시기,
 * 대화가 없으면 시대 기본 얼굴(avatars.ts ERA_AVATAR)과 같은 시기
 */
export function defaultLooks(chats: ChatEntry[]): Record<EraKey, number> {
  const pick = (era: EraKey) => {
    const looks = PROFILES[era].looks
    const avatar = chats.find((c) => c.era === era)?.avatar ?? ERA_AVATAR[era]
    return Math.max(0, looks.findIndex((l) => l.avatar === avatar))
  }
  return { past: pick('past'), present: pick('present'), future: pick('future') }
}
