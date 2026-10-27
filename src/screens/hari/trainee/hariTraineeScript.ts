/**
 * 반하리 · 2020 「독기 충만 연습생」 — 고정 대사와 흐름 데이터
 *
 * 원문은 `반하리_연습생시절.md`. 문서를 고치면 여기도 같이 고친다.
 *
 * Figma
 *   1200:13671  대화 시작   인물 가운데 + 가운데 자막 (클릭 · 스페이스로 다음 줄)
 *   1200:13761  채팅        인물 왼쪽 + 말풍선 + 입력창 (LLM)
 *   1200:13801  선택지      인물 왼쪽 + 질문 + 2지선다
 *
 * 흐름
 *   시작 자막 → 채팅 (identity · dream · school, LLM 3턴)
 *   → 선택지 → 반응 → 이어지는 대화 (LLM 2턴) → 경비실 방송 · 작별 자막 → 캐릭터 화면
 *   나가기는 어느 단계에서든 우상단 X → 확인창
 */

import { TRAINEE_PERSONA } from '../../../game/her/hariTraineePersona'
import type { HariStoryScript } from '../chat/hariStoryTypes'
import traineeMotion from '../../../assets/view-character/figures/present-predebut.webp'
import traineeAvatar from '../../../assets/avatars/present/pre-debut.png'

/** 상단 바 — 연도 알약 · 제목 알약 (1200:13730 / 13731) */
export const TRAINEE_YEAR = '2020'
export const TRAINEE_TITLE = '데뷔하고픈 엘리트 연습생'

/** 1200:13759 — 시작 자막. 거울 앞에서 카운트를 세다가 목소리를 듣는다 */
export const TRAINEE_OPENING = [
  '파이브, 식스, 세븐, 에잇… 아, 또 늦었어.',
  '…누구야? 연습실 문 잠갔는데.',
  '민지야? 장난치지 마, 나 진짜 놀랐잖아.',
  '…아닌데. 누구세요?',
] as const

/** 채팅으로 넘어가며 그녀가 먼저 묻는 말 — 첫 말풍선 */
export const TRAINEE_FIRST_ASK = '귀신은 아니죠? 이 건물 그런 소문 있단 말이에요.'

/** LLM 에게 넘기는 첫 두 턴. 대화는 반드시 user 로 시작해야 한다 */
export const TRAINEE_SEED_TURNS = [
  { role: 'user' as const, content: '(문 잠긴 연습실 안에서 목소리가 들린다)' },
  { role: 'assistant' as const, content: [...TRAINEE_OPENING, TRAINEE_FIRST_ASK].join(' ') },
]

/** LLM 이 답하는 턴 순서 (선택지 전까지). school 이 끝나면 선택지로 간다 */
export const TRAINEE_TURN_ORDER = ['identity', 'dream', 'school'] as const

/** 선택지 뒤 이어지는 대화 턴 수 — 다 차면 경비실 방송으로 마무리 */
export const TRAINEE_AFTER_TURNS = 2

/* ------------------------------------------------------------------------
 * 선택지 (1200:13801)
 * --------------------------------------------------------------------- */

/** 1200:13839 — 선택지 위 질문 */
export const TRAINEE_QUESTION = '꿈 하나 보고 다 내려놓는 거, 용기일까요? 무모한 걸까요?'

export type TraineeChoiceId = 'courage' | 'reckless'

export const TRAINEE_CHOICES: Record<TraineeChoiceId, { label: string; lines: string[] }> = {
  courage: {
    label: '용기예요',
    lines: ['그쵸! …그렇게 말해 주는 사람 처음이에요.', '다들 걱정만 하거든요. 엄마도, 담임 쌤도.'],
  },
  reckless: {
    label: '무모한 것 같아요',
    lines: ['…맞아요, 엄마도 그렇게 말해요.', '근데 이미 너무 와 버렸어요. 그러니까 잘돼야 돼요.'],
  },
}

/* ------------------------------------------------------------------------
 * 마무리 · 나가기
 * --------------------------------------------------------------------- */

/** 이어지는 대화가 끝나면 — 경비실 방송 뒤 작별 자막 (인물이 다시 가운데로) */
export const TRAINEE_CLOSING = [
  { kind: 'narr' as const, text: '— 지하 연습실, 소등하겠습니다. 남아 있는 연습생은 퇴실해 주세요.' },
  { kind: 'her' as const, text: '헐, 경비 아저씨. 저 이제 가야 돼요.' },
  { kind: 'her' as const, text: '내일 평가 잘 보면, 다음엔 TV에서 만나요. 꼭이요!' },
]

/** 우상단 X → 확인창에서 "여기까지" */
export const TRAINEE_FAREWELL = [
  { kind: 'her' as const, text: '아, 벌써 가세요? …내일 평가 끝나고 또 와요!' },
  { kind: 'narr' as const, text: '연습실 불빛이 흐려진다.' },
]

export const TRAINEE_EXIT = {
  question: '하리와의 대화를 멈출까요?',
  stay: '이어서 대화하기',
  leave: '여기까지',
} as const

/** 1168:9259 / 9261 — 입력창 · 보내기 */
export const TRAINEE_INPUT_PLACEHOLDER = '대화하기'
export const TRAINEE_SUBMIT = 'GO'
export const TRAINEE_INPUT_MAX = 80

/** 위기 신호가 보이면 화면 아래에 띄우는 도움 안내 — 전시 전 번호 재확인 필요 */
export const TRAINEE_HELP = '힘든 마음이 들 때 · 자살예방상담전화 109 · 정신건강위기상담 1577-0199 (24시간)'

/* ------------------------------------------------------------------------
 * 공용 대화 화면(HariStoryChat)에 넘기는 대본
 * --------------------------------------------------------------------- */

export const TRAINEE_STORY: HariStoryScript = {
  historyKey: 'hari2020',
  year: TRAINEE_YEAR,
  title: TRAINEE_TITLE,
  tone: 'trainee',
  // 전신 그림은 아직 — 실루엣 자리 (Figma 1200:13711 492 × 1530)
  figure: { width: 492, height: 1530, top: 116, centerX: 960, chatCenterX: 370 },
  motion: traineeMotion,
  avatar: traineeAvatar,
  nodes: { subtitle: '1200:13671', chat: '1200:13761', choice: '1200:13801' },
  opening: () => [...TRAINEE_OPENING],
  firstAsk: () => TRAINEE_FIRST_ASK,
  turnOrder: [...TRAINEE_TURN_ORDER],
  afterTurns: TRAINEE_AFTER_TURNS,
  question: TRAINEE_QUESTION,
  choices: TRAINEE_CHOICES,
  choiceOrder: ['courage', 'reckless'],
  closing: TRAINEE_CLOSING,
  farewell: TRAINEE_FAREWELL,
  exit: TRAINEE_EXIT,
  input: { placeholder: TRAINEE_INPUT_PLACEHOLDER, submit: TRAINEE_SUBMIT, max: TRAINEE_INPUT_MAX },
  help: TRAINEE_HELP,
  persona: TRAINEE_PERSONA,
}
