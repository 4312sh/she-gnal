/**
 * 반하리 · 2023 「데뷔하면 제일 먼저」 — 카메라 앞의 모습. 고정 대사와 흐름 데이터
 *
 * 원문은 `반하리_카메라앞.md`. 문서를 고치면 여기도 같이 고친다.
 * 화면은 2026 「공연장 뒷편의 대기실」과 같은 3차 디자인 흐름 (HariStoryChat · 몸짓 · 공간이동).
 *
 * 하루 스케줄 세 곳을 신호가 따라간다 (공간이동 2번)
 *   화장대  광고 촬영장 메이크업   reunion · ad (LLM 2턴)  → 공간이동
 *   무대    음악방송 리허설 직후   stage (LLM 1턴)         → 공간이동
 *   야경    이동하는 차 안         SNS 홍보 게시물 문구 선택지 → 반응 → 매니저 · 작별 → 캐릭터 화면
 *   2020 에서 하리를 만났으면(met) 그 목소리를 알아보고 재회로 시작한다.
 */

import { DEBUT_PERSONA } from '../../../game/her/hariDebutPersona'
import type { HariStoryScript } from '../chat/hariStoryTypes'
import { DEBUT_POSES } from '../prologue/HariPrologueScene'
import dresser from '../../../assets/hari/prologue/prologue-dresser.webp'
import stage from '../../../assets/hari/prologue/prologue-stage.webp'
import city from '../../../assets/hari/prologue/prologue-city.webp'
import debutAvatar from '../../../assets/avatars/present/on-camera.png'

export type DebutChoiceId = 'bright' | 'honest'

/** 홍보 게시물 문구 두 개 (선택지 앞에 화면에 뜬다) */
export const DEBUT_POST = {
  bright: '오늘도 감사한 하루! 촉촉함이 하루 종일, 여러분도 같이 느껴 봐요',
  honest: '오늘 촬영 길었지만, 끝나고 보니 좋은 하루였어요',
} as const

export const DEBUT_STORY: HariStoryScript = {
  historyKey: 'hari2023',
  year: '2023',
  title: '데뷔하면 제일 먼저',
  tone: 'debut',
  /** 화장대 → 무대 → 야경 — 밝은 낮에서 밤으로, 하루가 저문다 */
  rooms: [
    { id: 'dresser', src: dresser },
    { id: 'stage', src: stage },
    { id: 'city', src: city },
  ],
  /** 2026 하리와 같은 그림 — 입력 중 눈 깜빡임 · 생각중 팔 움직임 · 말할 때 웃는 몸짓 · 선택지 손짓 */
  poses: DEBUT_POSES,
  avatar: debutAvatar,
  nodes: { subtitle: '1463:4915', chat: '1373:41149', choice: '1508:14710' },

  /** Phase 1 — 화장대 앞에서 리터치를 받으며 광고 멘트를 혼자 연습한다 */
  opening: () => ['촉촉함이 하루 종일. …아니, 하루 \'종일\'에 힘을 더.', '촉촉함이 하루 종일! 응, 이거.'],
  /** <reunion> 첫 대사 */
  firstAsk: ({ met }) =>
    met
      ? '…잠깐, 이 목소리. 새벽 연습실에서. 진짜 TV에서 만났네요?'
      : '어? 스태프분이세요? 아, 마이크 켜진 거 아니죠? 안녕하세요, 하리입니다!',

  turnOrder: ['reunion', 'ad', 'stage'],
  warps: {
    // Phase 3 → 4 — "컷! 다음 씬 이동할게요" → 무대
    ad: {
      out: [
        { kind: 'narr', text: '— 컷! 오케이, 다음 씬 이동할게요.' },
        { kind: 'her', text: '감사합니다! 고생하셨습니다!' },
      ],
      to: 'stage',
      in: [{ kind: 'her', text: '여기가 오늘 저녁 음방 무대예요. 리허설 끝나서 지금은 비어 있어요.' }],
    },
    // Phase 4 → 5 — "하리 씨, 차 대기 중입니다" → 이동하는 차 안
    stage: {
      out: [
        { kind: 'her', text: '음방 1위는 아직이에요. 근데 첫 정산으로 엄마 패딩은 샀어요.' },
        { kind: 'her', text: '…엄마가 아까워서 아직 안 입으세요.' },
        { kind: 'narr', text: '— 하리 씨, 차 대기 중입니다.' },
      ],
      to: 'city',
      in: [],
    },
  },
  afterTurns: 0,

  /** Phase 5 — 밤, 숙소로 가는 차 안. 오늘 광고 홍보 게시물을 올려야 한다 */
  questionLead: () => [
    { kind: 'her', text: '오늘 광고 게시물 올려야 돼요. 문구 같이 골라 줄래요?' },
    { kind: 'narr', text: `A. ${DEBUT_POST.bright}` },
    { kind: 'narr', text: `B. ${DEBUT_POST.honest}` },
  ],
  question: '어떤 거 올릴 것 같아요?',
  choices: {
    bright: {
      label: 'A. 감사한 하루!',
      lines: ['그쵸! 저도 이거요. 이게 제일 하리 같아요.', '…좋아요 벌써 천 개 넘었다.'],
    },
    honest: {
      label: 'B. 촬영 길었지만',
      lines: [
        '…이게 더 좋긴 하다.',
        '근데 \'길었지만\'은 안 돼요. 기사 나요.',
        '그래도 고마워요. 이거 저장해 둘게요.',
      ],
    },
  },
  choiceOrder: ['bright', 'honest'],

  /** Phase 6 — 차가 숙소 앞에 선다 */
  closing: ({ name }) => [
    { kind: 'narr', text: '— 하리야, 내일 6시 출발.' },
    { kind: 'her', text: '네! …오늘 진짜 재밌었어요. 하루가 이렇게 짧았나.' },
    { kind: 'her', text: `${name ? `${name}님, ` : ''}내일 음방도 봐 주세요. 이번엔 1위 할지도 몰라요!` },
  ],
  farewell: [
    { kind: 'her', text: '아, 벌써 가요? 내일 음방 꼭 봐 주세요!' },
    { kind: 'narr', text: '— 신호가 끊긴다.' },
  ],
  exit: { question: '하리와의 대화를 멈출까요?', stay: '이어서 대화하기', leave: '여기까지' },

  input: { placeholder: '대화하기', submit: 'GO', max: 80 },
  help: '힘든 마음이 들 때 · 자살예방상담전화 109 · 정신건강위기상담 1577-0199 (24시간)',

  persona: DEBUT_PERSONA,
}
