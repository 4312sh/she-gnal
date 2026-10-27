/**
 * 이오 (미래 · 2999) — 캐릭터 화면 데이터
 * Figma 1169:9679 / 9569 / 9630 / 10250 의 자리표시 문구를 그대로 옮겼다.
 * 대사 · 요약 · 태그는 시나리오가 나오면 여기만 고치면 된다.
 */

export type EioTab = 'about' | 'analyze' | 'library'

export const EIO_TABS: { id: EioTab; label: string; ready: boolean }[] = [
  { id: 'about', label: 'About her', ready: true },
  { id: 'analyze', label: 'Analyze', ready: false },
  { id: 'library', label: 'Library', ready: false },
]

export type EioLine = { from: 'eio' | 'user'; text: string }

export type EioStory = {
  id: string
  /** 목록 · 칩에 쓰는 이름 */
  label: string
  /** 아직 안 열린 스토리 (어두운 줄) */
  locked?: boolean
  /** Summary 창 가운데 요약 */
  summary: string
  /** Summary 창 오른쪽 태그 4개 */
  tags: string[]
  /** Chat History 창 대화 — 이오와 유저가 번갈아 */
  chat: EioLine[]
}

const PLACEHOLDER_CHAT: EioLine[] = [
  { from: 'eio', text: '/EIO의 말/' },
  { from: 'user', text: '/유저의 말/' },
  { from: 'eio', text: '/EIO의 말/' },
  { from: 'user', text: '/유저의 말/' },
  { from: 'eio', text: '/EIO의 말/' },
  { from: 'user', text: '/유저의 말/' },
  { from: 'eio', text: '/EIO의 말/' },
  { from: 'user', text: '/유저의 말/' },
]

const locked = (n: number): EioStory => ({
  id: `story-${n}`,
  label: 'STORY',
  locked: true,
  summary: '',
  tags: [],
  chat: [],
})

export const EIO_STORIES: EioStory[] = [
  {
    id: 'prologue',
    label: 'PROLOGUE',
    summary: '/채팅 스토리 요약/',
    tags: ['TAG', 'TAG', 'TAG', 'TAG'],
    chat: PLACEHOLDER_CHAT,
  },
  locked(1),
  locked(2),
  locked(3),
  locked(4),
]

/** 좌하단 접속 정보 — Figma 시안 문구 그대로 (나혜석 화면에서 복사된 값으로 보임) */
export const EIO_TUNING = {
  year: '1935',
  destination: '京城 (GYEONGSEONG)',
  era: '昭和 10 · 1935',
  status: '接續 / connected',
}

export const EIO_LAST = { story: 'prologue', at: '26. 10. 11' }
