/**
 * 반하리 · 2026 스토리 「공연장 뒷편의 대기실」 — 고정 대사와 흐름 데이터
 *
 * 처음엔 프롤로그로 만들었다가 스토리 하나로 바꿨다 (코드 안의 이름 prologue · PROLOGUE_* 는 그대로).
 * 왼쪽 위 알약에는 'Prologue' 대신 대화하는 하리의 연도가 들어간다.
 *
 * 원문은 `반하리_챕터0_프롤로그.md`. 첫 인사(PROLOGUE_FIRST_ASK)는 Figma 1373:41149 문구 그대로.
 *
 * Figma (3차 디자인)
 *   1373:41149  대화 시작   하리의 말 + 입력란             · 눈 깜빡임
 *   1359:39625  유저의 답변 방금 보낸 말이 아래에 잠깐       · 눈 깜빡임
 *   1359:39635  생각중      /곱씹는 중..../                  · 팔 움직임
 *   1359:39645  하리의 답변 (도시 야경)                      · 웃는 몸짓
 *   1484:14471  공간이동    하리가 흐려진다 (opacity 0.29) → 배경이 무대로
 *   1463:4915   하리의 답변 (무대)                           · 웃는 몸짓
 *   1508:14710  선택지      질문 + 대답 둘                   · 손짓 (가슴에 손 → 손바닥)
 *   1380:41280  위쪽 바     NOW · PRESENT | 2026 · GO TO MAIN · CHAT HISTORY · STOP
 *   1259:31389  채팅 기록
 *   1359:39807  메인으로 나가기 확인
 *
 * 흐름
 *   시작 자막 → 채팅 identity · space (LLM 2턴) → 무대로 공간이동 → stage (LLM 1턴)
 *   → 선택지 → 반응(균열 한 줄) → after (LLM 1턴) → 매니저 노크 · 작별 → 캐릭터 화면
 */

export const PROLOGUE_YEAR = '2026'
/** 왼쪽 위 알약 (Figma 1345:37701 자리) — 대화하는 하리의 연도 */
export const PROLOGUE_BADGE = PROLOGUE_YEAR
export const PROLOGUE_TITLE = '공연장 뒷편의 대기실'

export type PrologueLine = { kind: 'her' | 'narr'; text: string }

/** Phase 1 — 거울 앞 표정 연습 중 신호가 닿는다 (자동 재생, 클릭 · 스페이스로 넘김) */
export const PROLOGUE_OPENING: PrologueLine[] = [
  { kind: 'her', text: '…입꼬리 조금만 더. 응, 이거.' },
  { kind: 'her', text: '…누구세요? 매니저 언니?' },
  { kind: 'her', text: '아니, 잠깐— 이거 몰카예요? 카메라 어디 있어요?' },
]

/** 1373:41149 — 놀란 얼굴에서 웃는 얼굴로. 입력란이 열린다 */
export const PROLOGUE_FIRST_ASK = '안녕!  만나서 반가워요! 제 새로운 매니저인가요?'

/** LLM 이 답하는 단계 — space 가 끝나면 무대로 공간이동, stage 가 끝나면 선택지 */
export const PROLOGUE_TURN_ORDER = ['identity', 'space', 'stage'] as const

/** 공간이동 앞뒤 고정 대사 (1484:14471) */
export const PROLOGUE_WARP_OUT = '아, 여기 말고 무대 쪽 보여줄게요. 리허설 끝나서 지금 비어 있거든요.'
export const PROLOGUE_WARP_IN = '짜잔, 여기가 오늘 제 무대예요! 조명 켜지면 진짜 예뻐요.'

/* ------------------------------------------------------------------------
 * 선택지 (1508:14710)
 * --------------------------------------------------------------------- */

export const PROLOGUE_QUESTION_LEAD = (name: string) => `그럼 저도 하나 물어봐도 돼요? ${name ? `${name}님은요—` : '그쪽은요—'}`
export const PROLOGUE_QUESTION = '좋아하는 사람이 있으면, 무대 위 모습이 좋아요? 아니면 끝난 다음 모습도 궁금해요?'

export type PrologueChoiceId = 'stage' | 'backstage'

export const PROLOGUE_CHOICES: Record<PrologueChoiceId, { label: string; lines: string[] }> = {
  stage: {
    label: '무대 위 모습이 좋아요',
    lines: ['그쵸! 그게 제일 예쁜 모습이니까요.', '…다행이다.'],
  },
  backstage: {
    label: '끝난 다음 모습도 궁금해요',
    lines: ['…그런 말 하는 사람 많은데, 막상 보면 다들 실망해요.', '아, 농담이에요, 농담!'],
  },
}

/** 선택지 뒤 이어지는 대화 턴 수 — 다 차면 매니저가 부른다 */
export const PROLOGUE_AFTER_TURNS = 1

/* ------------------------------------------------------------------------
 * 마무리 · 나가기
 * --------------------------------------------------------------------- */

export const PROLOGUE_CLOSING = (name: string): PrologueLine[] => [
  { kind: 'narr', text: '— 똑똑. 하리야, 5분!' },
  { kind: 'her', text: '아, 가봐야 돼요! 오늘 재밌었어요.' },
  { kind: 'her', text: `${name ? `${name}님, ` : ''}방송 꼭 봐주세요. 약속!` },
]

/** 우상단 X → "여기까지" */
export const PROLOGUE_FAREWELL: PrologueLine[] = [
  { kind: 'her', text: '아, 벌써 가요? 방송 꼭 봐주세요!' },
  { kind: 'narr', text: '— 신호가 끊긴다.' },
]

export const PROLOGUE_EXIT = {
  question: '하리와의 대화를 멈출까요?',
  stay: '이어서 대화하기',
  leave: '여기까지',
} as const

export const PROLOGUE_INPUT = { placeholder: '대화하기', submit: 'GO', max: 80 } as const

/** 1359:39644 — 생각중 */
export const PROLOGUE_THINKING = '곱씹는 중'

export const PROLOGUE_HELP = '힘든 마음이 들 때 · 자살예방상담전화 109 · 정신건강위기상담 1577-0199 (24시간)'
