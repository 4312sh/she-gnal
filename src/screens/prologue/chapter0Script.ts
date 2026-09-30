/**
 * Chapter 0. Prologue — 응접실 채팅 (0.13 ~ 0.18)
 *
 * `나혜석_챕터0_프롤로그.md` 의 Phase 1~5 를 그대로 옮긴 것.
 * 이름 비공개 · 친밀도 상한 18 · 나이 반응 1회 규칙이 여기에 들어 있다.
 *
 * Figma
 *   856:178  0.13  공간 진입 나레이션
 *   856:575  0.14  실루엣 첫 접촉
 *   856:219  0.15  정체 질문 + 입력창
 *   856:484  0.16  채팅 로그
 *   856:511  0.17  2지선다
 *   856:537  0.18  프롤로그 종료
 */

/* ========================================================================
 * 유저 정보 — 도입부 입력 화면에서 이미 받은 값
 * ===================================================================== */

export type Player = {
  name?: string;
  age?: number;
  gender?: string;
};

export function loadPlayer(): Player {
  try {
    const raw = window.localStorage.getItem('she-gnal:player');
    return raw ? (JSON.parse(raw) as Player) : {};
  } catch {
    return {};
  }
}

/** 고유수사 (스물넷, 서른둘 …). 나이 반응 대사에서 쓴다. */
const TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
const ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];

export function nativeAge(n: number): string {
  if (!Number.isFinite(n) || n < 1 || n > 99) return '';
  return TENS[Math.floor(n / 10)] + ONES[n % 10];
}

/**
 * 나이별 반응 — 프롤로그 전체에서 단 한 번만 쓴다.
 * 1935년 현재 그녀는 서른아홉. 그 기준으로 거리를 잰다.
 * 값이 없으면 null 을 돌려주고, 호출부는 해당 줄을 통째로 생략한다.
 */
export function ageReaction(age?: number): string | null {
  if (!age || !Number.isFinite(age)) return null;
  const n = nativeAge(age);
  if (age <= 19) return '그 나이엔 세상이 다 열려 있는 줄 알지. …나도 그랬소.';
  if (age <= 29) return `${n}이라. …내 그 나이는 참 소란스러웠는데.`;
  if (age <= 39) return '나와 그리 멀지 않구려. 그 나이가 제일 고단하오.';
  if (age <= 59) return '나보다 위구려. 그럼 내가 말을 가려야겠소.';
  return '…그리 사셨으면, 내가 물을 것이 더 많겠소.';
}

/** 이름이 없을 때를 대비한 호칭 */
export function callName(p: Player): string {
  return p.name?.trim() || '손님';
}

/* ========================================================================
 * 친밀도 — MD 의 프롤로그 전용 계산식
 * ===================================================================== */

export const INTIMACY = {
  start: 8,
  cap: 18, // 프롤로그에서 절대 넘을 수 없는 상한
  min: 0,
  perTurnMax: 1, // 한 턴에 오를 수 있는 최대치
} as const;

/** 조건을 여러 개 만족해도 한 턴 +1 을 넘지 않는다 */
export function applyIntimacy(current: number, delta: number): number {
  const capped = delta > 0 ? Math.min(delta, INTIMACY.perTurnMax) : delta;
  return Math.max(INTIMACY.min, Math.min(INTIMACY.cap, current + capped));
}

/** 0~5 냉담 / 6~12 기본 / 13~18 미세하게 누그러짐 */
export function intimacyTone(v: number): 'cold' | 'neutral' | 'warm' {
  if (v <= 5) return 'cold';
  if (v <= 12) return 'neutral';
  return 'warm';
}

/* ========================================================================
 * 상단 내레이션 바 (856:194 / 591 / 234 / 499 / 526 / 552)
 * ===================================================================== */

export const PARLOR_HEADER =
  '켜켜이 쌓인 습작들, 탁자위로 올려져 있는 어딘가 엔틱스러운 오브제들';

/* ========================================================================
 * Phase 1-a — 공간 진입 (856:178)
 * 서술만. 그녀는 아직 나타나지 않는다.
 * ===================================================================== */

export const PARLOR_NARRATION = [
  '발을 들이자, 잘 정돈된 응접실이 눈앞에 펼쳐졌다.',
  '창가의 의자, 낮게 깔린 양탄자, 오후의 빛이 스민 실내 —',
  '앞방의 스산함과는 달리, 사람의 온기가 남아 있는 공간이었다.',
] as const;

/* ========================================================================
 * Phase 1-b — 실루엣 첫 접촉 (856:575)
 * 화면 라벨은 아직 ??? . 이름을 절대 말하지 않는다.
 * ===================================================================== */

export const SILHOUETTE_LINES = [
  '"…남의 집을, 그리 거침없이 들어서는 손님은 오랜만이군."',
  '"놀라진 않겠소. 이 방엔 원래 이상한 것들이 많이 드나드니."',
  '"허나 목소리만 있고 몸이 없는 손님은— 자네가 처음이오."',
] as const;

/* ========================================================================
 * Phase 2 — 정체를 묻는다 (856:219)
 * 이름은 이미 안다. 모르는 건 "이것이 무엇인가".
 * ===================================================================== */

export function askIdentityLines(p: Player): string[] {
  const n = callName(p);
  return [
    `${n}이라 했소. …헌데 이름은 알아도, 당신이 뭔지는 모르겠구려.`,
    '좋소, 그럼 먼저 - 당신부터 말해보시오. 누구시오?',
  ];
}

export const INPUT_PLACEHOLDER = '';
export const SUBMIT_LABEL = '답변하다';

/* ========================================================================
 * Phase 3 — 공간으로 돌린다 (856:484)
 *
 * 유저 입력은 내용을 판정하지 않는다. 유형만 보고 한 문장으로 받는다.
 * (전시 환경에서 LLM 응답 지연·이탈을 피하기 위한 결정)
 * ===================================================================== */

export type ReplyKind = 'sincere' | 'jest' | 'empty';

export function classifyReply(text: string): ReplyKind {
  const t = text.trim();
  if (t.length === 0) return 'empty';
  if (t.length <= 2) return 'jest';
  return 'sincere';
}

/** 유형별 첫 응답 + 친밀도 증감 */
export const REPLY_RESPONSE: Record<
  ReplyKind,
  { line: string; intimacy: number }
> = {
  sincere: {
    line: '…그렇소? 알아듣진 못하겠으나, 거짓말하는 목소리는 아니구려.',
    intimacy: 1,
  },
  jest: { line: '농이오? …뭐, 실없는 손님도 손님이겠지.', intimacy: 0 },
  empty: { line: '말하기 싫으면 두시오. 나도 캐묻는 취미는 없소.', intimacy: 0 },
};

/** 응답 뒤에 이어지는 공간 이야기. 나이 반응은 호출부에서 끼워 넣는다. */
export const PARLOR_TALK = [
  '이 공간에 처음 온 사람이라니 흥미롭다만,',
  '여긴 손님을 들일 만한 집이 못 되오. 보다시피.',
  '켜켜이 쌓인 건 죄다 팔리지 않은 것들이고, 저 위에 올려둔 건… 버리지 못한 것들이지.',
] as const;

/* ========================================================================
 * Phase 4 — 선택지 (856:511)
 * 두 답의 친밀도는 같다. 정답이 있는 질문이 아니다.
 * ===================================================================== */

export function choiceQuestion(p: Player): string[] {
  return [
    `묻겠소. ${callName(p)}씨는—`,
    '사람이, 제 뜻대로 살 수 있다고 보시오?',
  ];
}

export type ChoiceId = 'yes' | 'no';

export const CHOICES: { id: ChoiceId; label: string; reply: string }[] = [
  {
    id: 'yes',
    label: '예.. 그럴거 같기도 하고',
    reply: '그렇군. …그 말을, 내가 스물다섯에 들었더라면 좋았을 텐데.',
  },
  {
    id: 'no',
    label: '아니오, 잘 모르겠어요.',
    reply: '솔직하군. 모르겠다는 대답이, 안다는 대답보다 나을 때가 있소.',
  },
];

export const CHOICE_INTIMACY = 1;

/* ========================================================================
 * Phase 5 — 마무리 (856:537)
 * 이름은 끝까지 주지 않는다. 다음을 약속만 한다.
 * ===================================================================== */

export const CLOSING_LINES: string[] = [
  '오늘은 여기까지 합시다. 나도 자네가 뭔지 아직 모르겠으니.',
  '다음에 또 닿거든— 그때는 내 이름을 말해주겠소.',
];

/** 친밀도 13 이상일 때만 붙는 한 마디 */
export const CLOSING_WARM_EXTRA = '…자네, 목소리가 나쁘지 않군.';

export const ENDING = {
  pill: 'connecting to the past',
  chapter: 'Chaptor 0. Prologue.',
  lines: ['프롤로그가 끝났습니다.', '그녀의 첫번째 이야기가 시작됩니다'],
  primary: '이어서 진행',
  secondary: '나가기',
} as const;

/* ========================================================================
 * 저장 — 챕터 1 로 넘길 값
 * ===================================================================== */

export type Chapter0Result = {
  playerName: string;
  playerAge?: number;
  chapter0Intimacy: number;
  prologueAnswer: ChoiceId | null;
  ageReactionUsed: boolean;
  completed: true;
};

export function saveChapter0(result: Chapter0Result): void {
  try {
    const raw = window.localStorage.getItem('she-gnal:player');
    const player = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(
      'she-gnal:player',
      JSON.stringify({ ...player, chapter0: result }),
    );
  } catch {
    // 저장 실패가 진행을 막지 않는다 (전시용)
  }
}
