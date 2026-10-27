/**
 * 하리 스토리 대화 — 챕터마다 갈아 끼우는 대본 · 인격(LLM) 형식
 *
 * 화면(HariStoryChat)은 하나고, 챕터는 이 두 가지만 채운다.
 *   HariStoryPersona  LLM 프롬프트 · 출력 검사 · 폴백        (src/game/her/hari*Persona.ts)
 *   HariStoryScript   고정 대사 · 단계 순서 · 선택지 · 그림 · 색 (src/screens/hari/<챕터>/*Script.ts)
 */

import type { HistoryKey } from '../../../game/chatHistory'
import type { Turn } from '../../../game/her/herChat'
import type { HariPose } from '../prologue/HariPrologueScene'

export type HariContext = {
  /** 유저가 밝힌 이름. 모르면 빈 문자열 */
  name: string
  /** 선택지에서 고른 답 */
  choiceLabel?: string
  /** 이어지는 대화에서 그녀가 먼저 꺼낼 화제 */
  seed?: string
  /** 이전 챕터에서 이미 만난 사이인가 (재회 대사) */
  met?: boolean
}

export type HariCheck = { ok: true } | { ok: false; reason: string }

/** 'after' 는 선택지 뒤 이어지는 대화 — 모든 챕터에 공통 */
export type HariStoryPersona = {
  buildPrompt: (phase: string, ctx: HariContext) => string
  clean: (text: string) => string
  validate: (text: string) => HariCheck
  fallback: (phase: string, userText: string, ctx: HariContext) => string
  topicSeed: (afterTurn: number) => string
}

export type BlinkPatch = {
  half: string
  closed: string
  /** 조각이 놓이는 자리 (원본 그림 px) */
  x: number
  y: number
  w: number
  h: number
  /** 원본 그림 크기 */
  srcW: number
  srcH: number
}

export type HariLine = { kind: 'her' | 'narr'; text: string }

export type HariChoice = { label: string; lines: string[] }

export type HariStoryScript = {
  /** 저장 · 기록 칸 */
  historyKey: HistoryKey
  /** 상단 바 — 연도 알약 · 제목 알약 */
  year: string
  title: string
  /** 화면 색 — 주황(연습실) / 분홍(방송국) / 회색(카메라 뒤) */
  tone: 'trainee' | 'debut' | 'backstage'
  /** 배경 그림 — 1x 기준 2669 × 1117, 왼쪽 -364 (Figma 배경 칸 그대로, hari.css .hr-bg). 없으면 그라데이션 자리 */
  background?: string
  /** 전신 그림 · 자리 (아트보드 px). 없으면 실루엣 자리 */
  figure?: {
    src?: string
    width: number
    height: number
    top: number
    centerX: number
    chatCenterX: number
    /** 눈 깜빡임 — 정지 그림 위에 반쯤 감은 눈 · 감은 눈 조각을 번갈아 덮는다 (원본 그림 px 기준) */
    blink?: BlinkPatch
  }
  /** 3차 디자인 — 가운데 상반신 움직이는 그림 (webp). 없으면 figure.src */
  motion?: string
  /** 채팅 기록 화면의 동그란 얼굴 */
  avatar?: string
  /** 생각중 문구 (기본 '곱씹는 중') */
  thinking?: string
  /** 몸짓별 움직이는 그림 (2026 대기실과 같은 자르기 · 자리) — 주면 motion 대신 이걸 쓴다 */
  poses?: Partial<Record<HariPose, string>>
  /** 인물 자리 (motion 하나만 쓸 때) — 기본 위 225.5 · 높이 858 */
  figureBox?: { top: number; height: number }
  /** 화면 전체 배경 공간들 (1920×1080) — 첫 칸에서 시작. 주면 background 대신 이걸 쓴다 */
  rooms?: { id: string; src: string }[]
  /**
   * 공간이동 — 이 단계의 대답이 끝나면: out 대사 → 하리 흐려짐 → to 공간으로 → 다시 또렷 → in 대사
   * (마지막 단계 뒤면 이어서 선택지)
   */
  warps?: Record<string, { out: HariLine[]; to: string; in: HariLine[] }>
  /** 선택지 질문 앞에 먼저 나오는 말 (질문은 question) */
  questionLead?: (ctx: { name: string }) => HariLine[]
  /** Figma 노드 (data-node-id) */
  nodes: { subtitle: string; chat: string; choice: string }

  /** 시작 자막 — met: 이전 챕터에서 만난 사이 */
  opening: (ctx: { met: boolean }) => string[]
  /** 채팅으로 넘어가며 그녀가 먼저 하는 말 (첫 말풍선) */
  firstAsk: (ctx: { met: boolean }) => string
  /** LLM 이 답하는 단계 순서 (선택지 전까지). 마지막 단계가 끝나면 선택지로 */
  turnOrder: string[]
  /** 선택지 뒤 이어지는 대화 턴 수 — 0 이면 반응 뒤 바로 마무리 */
  afterTurns: number

  question: string
  choices: Record<string, HariChoice>
  choiceOrder: string[]

  /** 이어지는 대화가 끝나면 — name: 유저가 밝힌 이름 */
  closing: HariLine[] | ((ctx: { name: string }) => HariLine[])
  /** 나가기 확인창에서 "여기까지" */
  farewell: HariLine[]
  exit: { question: string; stay: string; leave: string }

  input: { placeholder: string; submit: string; max: number }
  /** 위기 신호가 보이면 화면 아래에 띄우는 도움 안내 */
  help: string

  persona: HariStoryPersona
}

/** 개발용 진입 지점 */
export type HariStoryStart = 'opening' | 'chat' | 'choice' | 'after'

/** LLM 에게 넘기는 첫 두 턴 — 대화는 반드시 user 로 시작해야 한다 */
export function seedTurns(script: HariStoryScript, met: boolean): Turn[] {
  return [
    { role: 'user', content: '(목소리만 있는 상대가 말을 건다)' },
    { role: 'assistant', content: [...script.opening({ met }), script.firstAsk({ met })].join(' ') },
  ]
}
