/**
 * Chapter 1 · 도쿄 유학길 — 고정 대사와 흐름 데이터
 *
 * 원문은 `나혜석_챕터1_도쿄유학길.md` (v2). 문서를 고치면 여기도 같이 고친다.
 *
 * Figma
 *   934:5495  1914 / 오프닝      튜닝 로그
 *   934:5498  1914 / 썸네일      타이틀 카드 + 도입 나레이션
 *   929:5255  1914 / 첫 대사     그녀가 먼저 말을 건넴
 *   929:5290  1914 / 채팅        자유 대화
 *   930:5450  1914 / 선택지      전보 2지선다
 *   856:537   채팅 중단 확인      나가기 토글
 */

/* ------------------------------------------------------------------------
 * 934:5495 — 튜닝 로그
 *
 * Figma 원문은 `京城 1914 / 京城 (TOKYO) / 昭和 10 · 1914` 인데
 * 京城은 서울, 1914년은 大正 3년이라 바로잡았다.
 * --------------------------------------------------------------------- */
export const CH1_TUNING_LINES = [
  '· · · now tuning · · · 東京 1914 · · ·',
  '',
  '  ▁▂▃▄▅▆▇ signal weak ▇▆▅▄▃▂▁',
  '',
  '  DESTINATION ── 東京 (TOKYO)',
  '  YEAR ───────── 大正 3 · 1914',
  '  STATUS ─────── 接續 / connected',
] as const;

/** 챕터 배지 문구. Figma 타이틀 카드는 `1914. 도쿄유학길` (띄어쓰기 없음) */
export const CH1_BADGE = '1914. 도쿄 유학길';
export const CH1_TITLE_BADGE = '1914. 도쿄유학길';

/** 934:5514 — 타이틀 카드 도입 나레이션 */
export const CH1_INTRO = [
  '여름밤. 도쿄의 좁은 하숙방 앞.',
  '당신의 손에는 조선에서 온 전보 한 장이 들려 있다.',
  '문을 두드리자, 안에서 원고를 넘기던 소리가 멈춘다.',
] as const;

/** 상단 내레이션 바 (929:5314 자리). 장면이 바뀔 때마다 갈아 끼운다. */
export const CH1_HEADER = {
  door: '늦은 여름밤, 하숙방 문틈으로 새어 나오는 등잔 불빛',
  chat: '쓰다 만 원고, 창밖의 전차 소리, 문 앞의 낯선 배달부',
  telegram: '조선에서 온 전보 한 장, 한참을 말이 없는 그녀',
  after: '펼쳐진 전보, 조금 가까워진 목소리',
} as const;

/** 929:5255 — 그녀가 먼저 말을 건다 */
export const CH1_OPENING = [
  '이 밤중에 뉘시오? …전보라니요.',
  '조선에서 온 것이오? 잠깐, 아직 주지 마시오.',
] as const;

/** LLM 에게 넘기는 첫 두 턴. 대화는 반드시 user 로 시작해야 한다. */
export const CH1_SEED_TURNS = [
  { role: 'user' as const, content: '(전보를 들고 문을 두드린다)' },
  { role: 'assistant' as const, content: CH1_OPENING.join(' ') },
];

/* ------------------------------------------------------------------------
 * 단계
 * --------------------------------------------------------------------- */

export type Ch1Phase =
  | 'door'
  | 'stranger'
  | 'origin'
  | 'manuscript'
  | 'dream'
  | 'resolve'
  | 'resolveEarly'
  | 'afterglow';

/** LLM 이 답하는 턴 순서 (전보 전까지). resolve 가 끝나면 전보 장면으로 간다. */
export const CH1_TURN_ORDER: Ch1Phase[] = [
  'door',
  'stranger',
  'origin',
  'manuscript',
  'dream',
  'resolve',
];

/** 이 단계에서 "열어 보세요" 류의 재촉을 받으면 바로 전보로 간다 */
export const CH1_EARLY_OPEN_PHASES: Ch1Phase[] = ['stranger', 'origin', 'manuscript', 'dream'];

/* ------------------------------------------------------------------------
 * 전보 · 선택지 (930:5450)
 * --------------------------------------------------------------------- */

export const CH1_TELEGRAM_NARRATION = '당신이 전보를 건넨다. 그녀가 종이를 펼친다. 한참을 말이 없다.';

export function telegramLines(callee: string): string[] {
  return [
    '아버지시오. 좋은 혼처가 났으니, 공부는 그만두고 돌아오라 하시네요.',
    `…${callee}이라면 어찌하시겠어요?`,
  ];
}

export type Ch1ChoiceId = 'A' | 'B';

export const CH1_CHOICES: Record<
  Ch1ChoiceId,
  { label: string; trait: string; note: string; narration?: string; lines: string[] }
> = {
  A: {
    label: '돌아가서 아버지를 설득해 보세요',
    trait: '정이 깊다',
    note: '아버지를 원망하면서도, 끝내 미워하지는 못했다.',
    lines: [
      '설득이 되실 분이면 좋으련만요.',
      '…그래도 한 번은 가 봐야겠지요. 미워할 수가 없는 분이라서.',
      '다만 붓은 두고 가지 않겠소. 그건 아니 되오.',
    ],
  },
  B: {
    label: '돌아가지 마세요',
    trait: '고집이 있다',
    note: '안 된다는 말을 들으면, 그 길로 더 가고 싶어 했다.',
    lines: [
      '쉽게도 말씀하시오. 학비가 끊기면 어쩌라고요.',
      '…아니, 옳은 말씀이오. 끊기면 제 손으로 벌면 되지요.',
      '안 된다 하면, 저는 꼭 그 길로 가고 싶어지는 사람이오.',
    ],
  },
};

/* ------------------------------------------------------------------------
 * 이름 나누기
 * --------------------------------------------------------------------- */

export const CH1_NAME_ASK = '그러고 보니, 우린 아직 이름도 나누지 않았군요. 당신 먼저 말해 주시겠어요?';

export function nameStory(name: string): string[] {
  return [
    `${name} 씨. …좋은 이름이오.`,
    '이상하지요. 약조한 적도 없는데, 꼭 갚아야 할 빚 같은 것이 있소.',
    "어릴 적엔 이름이 없었답니다. 아버지는 저를 그냥 '아기'라 부르셨지요.",
    '학교에 가서야 이름이 생겼소. 명순이라고.',
    '경성으로 올라와서는 오라버니들과 같은 글자를 받았지요. 그때 처음으로, 제 이름 같았소.',
    '나혜석이오. 羅蕙錫.',
  ];
}

export const CH1_AFTER_NARRATION = '신호가 아직 이어져 있다.';

/* ------------------------------------------------------------------------
 * 나가기 (856:537)
 * --------------------------------------------------------------------- */

export const CH1_EXIT = {
  question: '채팅을 중단할까요?',
  stay: '이어서 진행',
  leave: '여기까지',
} as const;

export const CH1_FAREWELL = '…다음에 또 들리거든, 이번엔 제가 먼저 알아보지요.';
export const CH1_FADE = '신호가 흐려진다.';

/* ------------------------------------------------------------------------
 * 해금
 * --------------------------------------------------------------------- */

export const CH1_UNLOCK = {
  hometown: '고향 「水原」',
  name: '호칭 「羅蕙錫 · 나혜석」',
  trait: (t: string) => `「${t}」`,
} as const;

export const SUBMIT_LABEL = '답변하기'; // 1136:3498
export const INPUT_MAX = 120;

/**
 * "저는 지윤이라고 해요" → 지윤
 * 뽑지 못하면 게임 시작 때 입력한 이름을 쓴다.
 */
export function extractName(text: string, fallback: string): string {
  const fb = fallback.trim() || '손님';
  if (fallback && text.includes(fallback)) return fallback;
  let t = text.replace(/[.,!?…~"'“”]/g, ' ').replace(/\s+/g, ' ').trim();
  t = t.replace(/^(저는|전|제 이름은|내 이름은|나는|난)\s*/, '');
  t = t.replace(/\s*(라고|이라고)?\s*(해요|합니다|해|불러요|불러 주세요)$/, '');
  t = t.replace(/(이라고|라고|이에요|예요|입니다|이오|이요|요)$/, '');
  const last = t.split(' ').pop() ?? '';
  if (/^[가-힣A-Za-z]{1,6}$/.test(last) && !/^(저|제|나|내|이름|그냥|음|어|비밀)$/.test(last)) {
    return last;
  }
  return fb;
}
