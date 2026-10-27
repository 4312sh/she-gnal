import type { HistoryKey } from '../../game/chatHistory'

/**
 * 반하리 캐릭터 화면 데이터
 *   About her  1167:8447 (대시보드) / 1167:8708 (스토리 선택 · Summary)
 *              1167:8546 (Chat History) / 1171:11060 (창 접힘)
 *   SNS        1167:8614 (프로필 3장) / 1167:8663 (반하리 게시물)
 *
 * 문구는 지금 Figma 에 적힌 그대로다 (/…/ 로 감싼 건 Figma 자리표시 문구).
 * 디자인 · 대사가 확정되면 여기만 고치면 된다.
 *   - TUNING 은 Figma 에 나혜석 값(1935 · 京城)이 그대로 남아 있다
 */

export type HariStoryId = 'prologue' | '2020' | '2023' | '2024'

export type HariStory = {
  id: HariStoryId
  /** 카드 머리 (Prologue / 2020 …) */
  label: string
  title: string
}

export const HARI_STORIES: HariStory[] = [
  // 2026 공연장 뒷편의 대기실 — 처음엔 프롤로그였다가 스토리 하나로 바꿨다 (id 는 그대로 prologue)
  { id: 'prologue', label: '2026', title: '공연장 뒷편의 대기실' },
  { id: '2020', label: '2020', title: '독기 충만 연습생' },
  { id: '2023', label: '2023', title: '데뷔하면 제일 먼저' },
  { id: '2024', label: '2024', title: '새벽 3시, 편의점 앞' },
]

export type ChatLine = { from: 'hari' | 'user'; text: string }

export type HariStoryDetail = {
  /** Summary · Chat History 카드 제목 */
  heading: string
  /** Summary — 하리 말풍선 (내용 요약) */
  summary: string[]
  /** Summary 오른쪽 해시태그 */
  hashtags: string[]
  /** 왼쪽 기기 패널 칩 — 스토리를 열면 Locked 대신 보인다 */
  keywords: string[]
  /** Chat History — 나눈 대화 */
  history: ChatLine[]
}

const PLACEHOLDER_DETAIL: HariStoryDetail = {
  heading: '대기실에서의 첫 만남',
  summary: [],
  hashtags: ['#해시태그', '#해시태그', '#해시태그'],
  keywords: ['Keyword', 'Keyword', 'Keyword'],
  history: [
    { from: 'hari', text: '/하리의 말/' },
    { from: 'user', text: '사용자의 말' },
    { from: 'hari', text: '/하리의 말/' },
    { from: 'user', text: '사용자의 말' },
  ],
}

/**
 * 스토리별 내용
 *   summary — 그 스토리에서 오간 대화를, 대화가 끝난 뒤 하리가 사용자에게 문자로 보내는 말투로.
 *             시점은 그 스토리 속 하리 (2020 하리는 데뷔 이후를 모른다).
 *   hashtags · keywords · history — 아직 Figma 자리표시
 */
export const HARI_STORY_DETAIL: Record<HariStoryId, HariStoryDetail> = {
  /* 2026 음악방송 대기실 — 카메라가 켜져 있다고 믿는 하리 */
  prologue: {
    ...PLACEHOLDER_DETAIL,
    heading: '공연장 뒷편의 대기실',
    summary: [
      '아까 대기실에서 말 건 거 맞죠? 저 진짜 몰카인 줄 알았어요ㅎㅎ',
      '무대 위가 좋냐고 물어본 거, 그냥 궁금해서였어요. 신경 쓰지 마요!',
      '오늘 방송 꼭 봐요. 약속한 거예요',
    ],
  },
  /* 2020 새벽 지하 연습실 — 월말평가 전날, 열일곱 연습생 */
  '2020': {
    ...PLACEHOLDER_DETAIL,
    heading: '독기 충만 연습생',
    summary: [
      '새벽에 연습실에서 말 걸어 준 거 아직도 신기해요',
      '꿈 얘기 끝까지 들어 줘서 고마워요. 문제집 얘긴 엄마한텐 비밀!',
      '저 월평 잘 봤어요!! 데뷔조 들어갈지도 몰라요',
    ],
  },
  /* 2023 데뷔 — 약속했던 '제일 먼저' 하고 싶던 일 */
  '2023': {
    ...PLACEHOLDER_DETAIL,
    heading: '데뷔하면 제일 먼저',
    summary: [
      '오늘 광고 촬영장부터 음방 무대까지 따라와 준 거 맞죠? 하루가 진짜 짧았어요!',
      '첫 정산으로 엄마 패딩 샀어요. 엄마는 아까워서 아직 안 입으시지만요',
      '게시물 문구 같이 골라 줘서 고마워요. 내일 음방도 봐 주세요!',
    ],
  },
  /* 2024 — 새벽 3시 편의점 앞. 카메라 뒤, 꾸밀 힘이 없는 하리 */
  '2024': {
    ...PLACEHOLDER_DETAIL,
    heading: '새벽 3시, 편의점 앞',
    summary: [
      '어제 새벽엔 그냥 좀 피곤했어',
      '휴대폰에 있던 거, 그건 그냥 잊어',
      '…그래도 옆에 있어 줘서 고마웠어',
    ],
  },
}

/**
 * Chat History 저장 칸 — 스토리별로 대화를 접속(세션) 단위로 쌓는다 (game/chatHistory).
 * 대화 화면이 생긴 스토리만 여기에 칸을 둔다. 칸이 없으면 "아직 나눈 대화가 없어요".
 */
export const HARI_HISTORY_KEY: Partial<Record<HariStoryId, HistoryKey>> = {
  prologue: 'hariPrologue',
  '2020': 'hari2020',
  '2023': 'hari2023',
  '2024': 'hari2024',
}

/** 상단 탭. Charactor 는 배지, 나머지는 탭 */
export type HariTab = 'about' | 'sns' | 'library'
export const HARI_TABS: { id: HariTab; label: string; ready: boolean }[] = [
  { id: 'about', label: 'About her', ready: true },
  { id: 'sns', label: 'SNS', ready: true },
  { id: 'library', label: 'Library', ready: false },
]

export type ProfileTone = 'pink' | 'cyan'

export type HariProfile = {
  work: string
  feeling: string
  relation: string
  /** Relation 칩 색 — 팬(시안) / 그 외(분홍) */
  relationTone: ProfileTone
}

/** 대시보드 위 칸 — 지금은 Figma 값 하나. 스토리 진행에 따라 바뀔 자리 */
export const HARI_PROFILE: HariProfile = {
  work: '열정가득 연습생',
  feeling: '즐거워',
  relation: '나를 응원해주는 팬',
  relationTone: 'cyan',
}

export const HARI_TUNING = {
  year: '1935',
  destination: '京城 (GYEONGSEONG)',
  era: '昭和 10 · 1935',
  status: '接續 / connected',
}

/** 왼쪽 기기 패널의 해금 버튼 문구 */
export const HARI_UNLOCK_LABEL = '2020 대화 시 해금'

/** 기록이 없을 때 Last Shegnal 칸 */
export const HARI_LAST_FALLBACK = '2026.9.30'

/* ---- SNS ---------------------------------------------------------------- */

export type SnsProfileId = 'banhari' | 'hari' | 'hr'

export type SnsProfile = {
  id: SnsProfileId
  name: string
  /** 프로필 원 바탕색 (Figma 원 채움) */
  circle: string
  /** 이름 옆 상태 점 — 없으면 점 없음 */
  dot?: string
  /** 게시물 화면이 있는 계정 */
  hasPost: boolean
}

export const SNS_PROFILES: SnsProfile[] = [
  { id: 'banhari', name: '반하리', circle: '#c8ffe6', hasPost: true },
  { id: 'hari', name: 'HARI', circle: '#ffddf4', dot: '#00aeff', hasPost: false },
  { id: 'hr', name: 'ㅎㄹ', circle: '#8136b1', dot: '#d9d9d9', hasPost: false },
]

export type SnsPost = {
  /** 창 머리 알약 */
  year: string
  handle: string
  meta: string
  likes: string
  body: string[]
  hashtags: string[]
  /** 왼쪽 전신 그림 아래 말풍선 */
  speech: string
}

export const SNS_POST: SnsPost = {
  year: '/년도/',
  handle: 'banhari_',
  meta: '2020y posting',
  likes: '좋아요 20개',
  body: ['오늘도 연습! 연습!', '월말평가에서 좋은 평을 받았어..!', '나 데뷔할 수 있겠지?'],
  hashtags: ['#해시태그', '#해시태그', '#해시태그'],
  speech: '/*하리의 말/',
}
