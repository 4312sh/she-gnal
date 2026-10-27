/**
 * 반하리 · 2024 「새벽 3시, 편의점 앞」 — 카메라 뒤의 모습. 고정 대사와 흐름 데이터
 *
 * 원문은 `반하리_카메라뒤.md` (원문은 2026 · 스물셋 → 게임 카드에 맞춰 2024 · 스물하나, 데뷔 2년차로 옮김).
 * 화면은 2023 · 2026 과 같은 3차 흐름 (HariStoryChat). 다만 이 하리는 웃지 않는다 —
 * 몸짓 그림 대신 회색 후드 정지 그림, 화면은 회색(backstage) 톤, 공간이동 없음.
 *
 * 흐름
 *   시작 자막 (편의점에서 빈손으로 나온다) → identity · emptyhand (LLM 2턴)
 *   → 휴대폰 화면이 켜진다 (비밀 계정 글 세 줄) → account (LLM 1턴)
 *   → 선택지 "봤어 / 못 본 척" → 반응 → after (LLM 1턴) → 마무리 (스폰 미리보기 한 줄) → 캐릭터 화면
 *
 * 안전: 섭식 문제는 '괴리감'까지만. 체중 · 칼로리 · 행위 · 방법은 고정 대사에도 LLM 에도 없다.
 */

import { BACKSTAGE_PERSONA } from '../../../game/her/hariBackstagePersona'
import type { HariStoryScript } from '../chat/hariStoryTypes'
import city from '../../../assets/hari/prologue/prologue-city.webp'
import hood from '../../../assets/view-character/figures/present-backstage.webp'
import offCamera from '../../../assets/avatars/present/off-camera.png'

export type BackstageChoiceId = 'saw' | 'pretended'

/** 벤치 위 휴대폰에 열린 비밀 계정 — 하리만 아는 글 */
export const BACKSTAGE_ACCOUNT = [
  '오늘도 옆자리 애가 더 예뻤다',
  '조명 꺼지면 나는 아무것도 아님',
  '잘한다는 말 다 거짓말 같다',
] as const

export const BACKSTAGE_STORY: HariStoryScript = {
  historyKey: 'hari2024',
  year: '2024',
  title: '새벽 3시, 편의점 앞',
  tone: 'backstage',
  /** 숙소 근처 골목 — 밤 도시 하나. 공간이동 없이 여기서만 */
  rooms: [{ id: 'city', src: city }],
  /** 회색 후드 — 웃는 몸짓이 없다 */
  motion: hood,
  figureBox: { top: 190, height: 1240 },
  avatar: offCamera,
  thinking: '말을 고르는 중',
  nodes: { subtitle: '1463:4915', chat: '1373:41149', choice: '1508:14710' },

  /** Phase 1 — 편의점 문이 열렸다 닫힌다. 손에는 아무것도 없다 */
  opening: ({ met }) => [
    '— 새벽 3시. 편의점 문이 열렸다 닫힌다.',
    '— 손에는 아무것도 없다.',
    ...(met ? ['…또 그 목소리네.'] : ['…누구야.']),
  ],
  firstAsk: () => '여기 왜 왔어. 아무도 모르는 데로 나온 건데.',

  turnOrder: ['identity', 'emptyhand', 'account'],
  warps: {
    // emptyhand 가 끝나면 — 같은 자리에서 벤치 위 휴대폰 화면이 켜진다 (공간이동 없음)
    emptyhand: {
      out: [],
      to: 'city',
      in: [
        { kind: 'narr', text: '— 벤치 위 휴대폰 화면이 켜진다. 열려 있는 건 아무도 모르는 계정.' },
        ...BACKSTAGE_ACCOUNT.map((t) => ({ kind: 'narr' as const, text: `「${t}」` })),
        { kind: 'her', text: '…봤지.' },
      ],
    },
  },
  afterTurns: 1,

  /** Phase 4 — account 대답 뒤 */
  questionLead: () => [{ kind: 'her', text: '다들 모르는 거야. 이거.' }],
  question: '방금 거, 어떻게 할 거야.',
  choices: {
    saw: {
      label: '봤어. 그것도 너잖아',
      lines: ['…그거 아무도 몰라. 회사도, 멤버들도.', '이상하다. 들켰는데 좀 편해.'],
    },
    pretended: {
      label: '아무것도 못 봤어',
      lines: ['…응. 못 본 거야.', '근데 고마워. 그렇게 말해 줘서.'],
    },
  },
  choiceOrder: ['saw', 'pretended'],

  /** Phase 5 — 해결되지 않는다. 대신 한 마디 더 길어진 채로, 다음 이야기의 그림자 */
  closing: ({ name }) => [
    { kind: 'her', text: '들어가야 돼. 여섯 시에 샵이야.' },
    { kind: 'her', text: `${name ? `${name}, ` : ''}오늘 여기서 본 거… 그냥 새벽이라 그런 거야.` },
    { kind: 'narr', text: '— 휴대폰이 울린다. 저장 안 된 번호, 메시지 한 줄.' },
    { kind: 'narr', text: '「하리 씨, 회장님이 따로 한번 뵙고 싶어 하십니다.」' },
    { kind: 'her', text: '…' },
  ],
  farewell: [
    { kind: 'her', text: '…가. 나도 곧 들어갈 거야.' },
    { kind: 'narr', text: '— 신호가 끊긴다.' },
  ],
  exit: { question: '하리와의 대화를 멈출까요?', stay: '조금 더 있기', leave: '여기까지' },

  input: { placeholder: '말 걸기', submit: 'GO', max: 80 },
  help: '힘든 마음이 들 때 · 자살예방상담전화 109 · 정신건강위기상담 1577-0199 (24시간) · 섭식장애 상담 1577-0199',

  persona: BACKSTAGE_PERSONA,
}
