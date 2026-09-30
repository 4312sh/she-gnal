/**
 * Chapter 0. Prologue — 오프닝 ~ 0.2번 대사 스크립트
 *
 * Figma
 *   0. 프롤로그 오프닝   856:68  (튜닝 텍스트)
 *   0. 프롤로그 오프닝   856:71  (인용구)
 *   0. 프롤로그 시작     856:76  (챕터 타이틀 카드)
 *   0. 1번               856:94  (도착 · 독백)
 *   0. 2번               856:797 (들어간다 버튼)
 */

/** 856:68 — 부팅 직후 튜닝 로그. Victor Mono. */
export const OPENING_TUNING_LINES = [
  '· · · now tuning · · · 京城 1935 · · ·',
  '',
  '  ▁▂▃▄▅▆▇ signal weak ▇▆▅▄▃▂▁',
  '',
  '  DESTINATION ── 京城 (GYEONGSEONG)',
  '  YEAR ───────── 昭和 10 · 1935',
  '  STATUS ─────── 接續 / connected',
] as const;

/** 856:71 — 아뜰리에 외경 위에 얹히는 인용구. */
export const OPENING_QUOTE_LINES = [
  '"여자가 그림을 그리고,',
  '여자가 글을 쓰고, 여자가 제 뜻대로 산다.',
  '…그게 그리도 이상한 일이오?"',
] as const;

/** 856:76 — 챕터 타이틀 카드. */
export const TITLE_CARD = {
  chapter: 'Chaptor 0. Prologue.',
  lines: ['과거의 시대로 접속합니다.', '당신은 지금 1935년 경성입니다.'],
} as const;

/** 856:94 / 856:797 — 상단에 고정되는 내레이션 바. */
export const ARRIVAL_HEADER =
  '당신은 지금, 물감과 커피가 뒤섞인 묘한 향기가 나는 아뜰리에 앞에..';

/**
 * 하단 2줄 대사창에 흘러가는 줄.
 *
 * `narration` — 서술. 회색 24px (Figma 856:110)
 * `inner`     — 주인공 속마음. 흰색 32px (Figma 856:111 / 856:812)
 *
 * 화면에는 항상 직전 줄이 위(흐리게), 현재 줄이 아래(선명하게) 표시된다.
 * 마지막 줄에서 `showEnterButton: true` → 856:797 상태(들어간다 버튼)로 전환.
 */
export type ArrivalLine = {
  id: string;
  kind: 'narration' | 'inner';
  text: string;
  /** 이 줄에서 '들어간다' 버튼을 노출한다 (= 0.2번 화면) */
  showEnterButton?: boolean;
};

export const ARRIVAL_LINES: ArrivalLine[] = [
  {
    id: 'p0-01',
    kind: 'narration',
    text: ' 눈을 떴을 때, 세상은 온통 잿빛 스케치 같았다.',
  },
  {
    id: 'p0-02',
    kind: 'inner',
    text: '(여긴… 어디지? 방금까지 분명 다른 곳에 있었는데.)',
  },
  {
    id: 'p0-03',
    kind: 'narration',
    text: ' 손끝에 닿는 공기가 서늘하다. 꿈이라기엔 너무 또렷하다.',
  },
  {
    id: 'p0-04',
    kind: 'inner',
    text: '(종이 냄새… 아니, 기름 냄새인가.)',
  },
  {
    id: 'p0-05',
    kind: 'narration',
    text: ' 문틈으로 희미한 불빛이 샌다. 안에 누군가 있다.',
  },
  {
    id: 'p0-06',
    kind: 'inner',
    text: '(…돌아가는 길은, 아무래도 보이지 않는다.)',
  },
  {
    id: 'p0-07',
    kind: 'inner',
    text: '(…한번, 들어가 볼까.)',
    showEnterButton: true,
  },
];

export const ENTER_BUTTON_LABEL = '들어간다';
