/**
 * 이오 · 프롤로그 「고대 신호」 — 고정 대사와 흐름 데이터
 *
 * 원문은 `이오_프롤로그_고대신호.md`. 첫 말(EIO_FIRST_ASK)은 Figma 1373:41123 문구 그대로.
 *
 * Figma
 *   1492:14550  대화 시작 (숲)   이오의 말 + 입력란               · 손 인사(wave)
 *   1373:41123  입력 대기 (숲)   같은 화면, 몸짓만 멈춤             · 흔들림(sway)
 *   1359:39986  유저의 답변      방금 보낸 말이 아래에 잠깐         · wave
 *   1359:40041  생각중           곱씹는 중...                       · wave
 *   1359:40068  이오의 답변 (숲)  가까이 다가와 말한다              · sway / shake
 *   1563:20530  이오의 답변 (스튜디오)                              · sway / shake
 *   1564:20557  선택지 (스튜디오) 대답 둘                           · sway
 *   1380:41300  위쪽 바          NOW · FUTURE | 연도 · GO TO MAIN · CHAT HISTORY · STOP
 *   1359:39915  채팅 기록
 *   1359:39959  끝내기 확인
 *
 * 흐름
 *   시작(숲) → contact · ancient (LLM 2턴) → 스튜디오로 공간이동 → camera · offcamera · body · signal (LLM 4턴)
 *   → 단어 질문 · 선택지 → 반응 → 이름 나누기 → 이어지는 대화 (끝없음 · 나가기로만 끝)
 */

import type { EioPhase } from '../../../game/her/eioProloguePersona'

/** 위쪽 바 연도 알약 · 채팅 기록 머리 — Figma 위쪽 바에는 '2120' 이 들어가 있으나 설정(2999)에 맞췄다 */
export const EIO_YEAR = '2999'
export const EIO_BADGE = 'Prologue'
export const EIO_TITLE = '고대 신호'

export type EioScene = 'forest' | 'studio'

/** sys: 시스템 줄 (고대어 해석 · 신호 수신) / narr: 나레이션 / her: 이오의 말 */
export type EioLine = { kind: 'her' | 'narr' | 'sys'; text: string; misread?: boolean }

/** 숲에서 신호가 닿는다 (자동 재생, 클릭 · 스페이스로 넘김) */
export const EIO_OPENING: EioLine[] = [
  { kind: 'sys', text: '알 수 없는 주파수에서 신호 수신 · 발신 시점 추정 불가' },
]

/** 1373:41123 — 입력란이 열린다 */
export const EIO_FIRST_ASK = '사용자 감지, 사용자 감지,\n대화를 건네봅니다.'

/** LLM 단계 순서 (선택지 전까지). warpAfter 가 끝나면 스튜디오로 */
export const EIO_TURN_ORDER: EioPhase[] = ['contact', 'ancient', 'camera', 'offcamera', 'body', 'signal']
export const EIO_WARP_AFTER: EioPhase = 'ancient'

/** 공간이동 앞뒤 */
export const EIO_WARP_OUT: EioLine[] = [{ kind: 'her', text: '이 좌표는 송출에 적합하지 않습니다. 제가 일하는 곳으로 이동하겠습니다.' }]
export const EIO_WARP_IN: EioLine[] = [
  { kind: 'sys', text: '좌표 이동 완료 · 送出 STUDIO 7' },
  { kind: 'her', text: '이동을 완료했습니다. 이곳이 제가 카메라 앞에 서는 곳입니다.' },
]

/** 선택지 — 그 신호의 이름 */
export const EIO_QUESTION: EioLine[] = [
  { kind: 'sys', text: '미분류 내부 신호 · 감정 로그에 대응 단어 없음' },
  { kind: 'her', text: '고대인은 이 신호를 무엇이라 불렀습니까? 정확한 단어를 알려 주십시오.' },
]

export type EioWordId = 'lonely' | 'longing'

export const EIO_CHOICES: Record<EioWordId, { word: string; label: string; lines: string[]; log: string }> = {
  lonely: {
    word: '외로움',
    label: "그건 '외로움'이라고 해요",
    lines: [
      '외로움. …등록했습니다.',
      "사전에는 '혼자라서 생기는 상태'라고 되어 있습니다. 그런데 저는 지금 혼자가 아닙니다. 당신이 수신되고 있습니다.",
      '그렇다면 이 신호는 줄어야 합니다. …줄어들고 있습니다.',
    ],
    log: '외로움 — 혼자일 때 생기는 신호. 송신자가 있으면 줄어든다.',
  },
  longing: {
    word: '그리움',
    label: "그건 '그리움'이라고 해요",
    lines: [
      '그리움. …등록했습니다.',
      "사전에는 '무언가를 보고 싶어 하는 상태'라고 되어 있습니다.",
      '저는 무엇을 보고 싶어 하는지 모릅니다. 그런데 그 단어를 들은 뒤로, 신호가 방향을 갖게 되었습니다.',
    ],
    log: '그리움 — 대상을 모르는 채로도 생기는 신호. 방향이 있다.',
  },
}
export const EIO_CHOICE_ORDER: EioWordId[] = ['lonely', 'longing']

/** 이름 나누기 */
export const EIO_NAME_ASK = '송신자 등록을 완료하려면 식별 이름이 필요합니다. 당신의 이름을 송신해 주십시오.'
export const EIO_NAME_LINES = (name: string): EioLine[] => [
  { kind: 'her', text: `${name}. 등록했습니다.` },
  { kind: 'her', text: '저의 식별 이름은 이오입니다. 촬영용 호칭입니다.' },
  { kind: 'her', text: '원래 이름은 교체 과정에서 기록이 남지 않았습니다.' },
  { kind: 'her', text: `…${name}. 소리 내어 부르니 응답 지연이 없습니다. 이 이름은 오래 저장하겠습니다.` },
]

/** 나가기 — 이름을 나눈 뒤라면 배운 단어를 처음으로 맞게 쓴다 */
export const EIO_FAREWELL = (name: string, word?: string): EioLine[] =>
  name && word
    ? [
        { kind: 'her', text: `신호가 약해지고 있습니다. …${name}.` },
        { kind: 'her', text: `다음 수신까지, 저는 ${word}${hasBatchim(word) ? '을' : '를'} 느낄 것입니다. 이 문장은 맞습니까?` },
        { kind: 'narr', text: '신호가 흐려진다.' },
      ]
    : [
        { kind: 'her', text: '신호가 약해지고 있습니다. 관찰을 중단합니다. …다음에도 같은 주파수로 송신해 주십시오.' },
        { kind: 'narr', text: '신호가 흐려진다.' },
      ]

function hasBatchim(word: string) {
  const c = word.charCodeAt(word.length - 1) - 0xac00
  return c >= 0 && c % 28 !== 0
}

export const EIO_THINKING = '곱씹는 중'
export const EIO_INPUT = { placeholder: 'Texting to her', submit: 'SEND', max: 120 }
export const EIO_CRISIS_REPLY = '수신했습니다. 그 신호는 혼자 처리하지 않는 것이 좋습니다. 당신의 시대에 도움을 요청할 수 있는 곳이 있습니다.'
export const EIO_HELP = '힘든 마음이 들 때 · 자살예방상담전화 109 · 정신건강위기상담 1577-0199 (24시간)'
