import type { Chapter1Save, Chapter2Save } from '../../game/types';

/**
 * 캐릭터 화면 (Figma 923:4434 · 936:6268) 에 들어가는 글과 상태
 *
 * Figma 원문에서 바로잡은 것
 *   - Chractor → Character
 *   - 3/1 운동 → 3·1 운동, 이혼고백서 → 이혼고백장 (원래 글 제목)
 *   - 대시보드 헤더 1913 → 1914 (스토리 목록 · 채팅 챕터와 통일)
 *   - 접속 정보 1914 → 東京 / 大正 3
 */

export type StoryId = 'prologue' | 'ch1' | 'ch2' | 'firstLove' | 'march1' | 'ch4a' | 'ch4b' | 'ch4c' | 'ch4d';

export type StoryRow = {
  id: StoryId;
  year: string;
  title: string;
  /** locked: 회색 · ? 표시 (923:4492 계열) */
  locked?: boolean;
  /** 1916 칸만 높이가 57px (923:4471) */
  tall?: boolean;
  /** 지금 들어갈 수 있는 채팅 챕터 */
  playable?: boolean;
};

export const STORY_ROWS: StoryRow[] = [
  { id: 'prologue', year: 'Prologue', title: '첫 조우' },
  { id: 'ch1', year: '1914', title: '도쿄 유학길', playable: true },
  { id: 'firstLove', year: '1916', title: '첫 사랑', tall: true },
  { id: 'march1', year: '1919', title: '3·1 운동' },
  { id: 'ch2', year: '1920', title: '네 가지 조건', playable: true },
  { id: 'ch4a', year: '?', title: '팔리지 않는 그림', locked: true },
  { id: 'ch4b', year: '?', title: '유럽 여행', locked: true },
  { id: 'ch4c', year: '?', title: '이혼고백장', locked: true },
  { id: 'ch4d', year: '?', title: '병에 걸리다', locked: true },
];

/** 대시보드 — 스토리를 골랐을 때 (923:4563 ~ 4572) */
export type StoryEntry = {
  header: string;
  poem: string[];
  buttons: { label: string; body: string[] }[];
};

export const STORY_ENTRIES: Partial<Record<StoryId, StoryEntry>> = {
  ch1: {
    header: '1914 | 도쿄 유학길',
    poem: [
      '처음 건너는 바다였다.',
      '처음 맡아 본 유화 냄새,',
      '처음 들어 본 "여자가 무슨".',
      '…처음으로, 그 말이 싫지 않았다.',
    ],
    buttons: [
      {
        label: '바다 건너의 교실',
        body: [
          '오빠가 권했고, 그녀는 망설이지 않았다.',
          '도쿄의 여자미술학교 서양화부.',
          '조선 여자가 유화를 배우러 바다를 건너는 건',
          '그때 거의 들어 본 적 없는 일이었다.',
        ],
      },
      {
        label: '돌아오라는 전보',
        body: [
          '좋은 혼처가 났으니 공부를 그만두고 돌아오라.',
          '아버지의 전보에 그녀는 답하지 않았다.',
          '학비가 끊기자 한 해 동안 아이들을 가르쳐',
          '돈을 모았고, 다시 바다를 건넜다.',
        ],
      },
      {
        label: '아껴 쓴 물감',
        body: [
          '유화 물감은 한 방울도 허투루 쓸 수 없었다.',
          '교실에 조선 여학생은 거의 그녀 혼자였다.',
          '외로웠지만, 그 말은 어디에도 적지 않았다.',
        ],
      },
    ],
  },
  ch2: {
    header: '1920 | 네 가지 조건',
    poem: ['사랑할 것, 붓을 막지 말 것,', '따로 살게 해 줄 것.', '…넷째는, 아무에게도 말하지 않았다.'],
    buttons: [
      {
        label: '신문에 낸 혼인',
        body: [
          '1920년 4월, 청첩장 대신 신문에 혼인을 알렸다.',
          '열흘 가까이 같은 광고가 실렸다.',
          '수군대는 소리가 들렸지만,',
          '그녀는 제 혼인을 제 손으로 알리고 싶었다.',
        ],
      },
      {
        label: '세 가지와 하나',
        body: [
          '평생 지금처럼 사랑해 줄 것.',
          '그림 그리는 것을 방해하지 말 것.',
          '시어머니, 전처의 딸과는 따로 살게 해 줄 것.',
          '넷째는 그녀만 아는 일이었다.',
          '그이는 모두 받아들였고, 셋은 끝까지 지켰다.',
          '지켜지지 않은 하나는,',
          '그녀가 가장 당연하다 여긴 첫째였다.',
        ],
      },
      {
        label: '이듬해 봄의 전람회',
        body: [
          '그이는 약속대로 화실을 내주었다.',
          '이듬해 봄, 경성에서 유화 70여 점을 걸었다.',
          '조선 여자가 유화로 연 첫 개인전이었다.',
          '그 그림들은 지금 대부분 남아 있지 않다.',
        ],
      },
    ],
  },
};

/** 좌하단 접속 정보 (923:4543 ~ 4545) */
export type Tuning = { year: string; destination: string; era: string };

export const TUNING_DEFAULT: Tuning = {
  year: '1935',
  destination: '京城 (GYEONGSEONG)',
  era: '昭和 10 · 1935',
};

export const TUNING_BY_STORY: Partial<Record<StoryId, Tuning>> = {
  ch1: { year: '1914', destination: '東京 (TOKYO)', era: '大正 3 · 1914' },
  ch2: { year: '1920', destination: '京城 (GYEONGSEONG)', era: '大正 9 · 1920' },
};

/** 대시보드 — 기본 (936:6284 ~ 6307). 챕터 1 을 마쳐야 채워진다 */
export type Profile = {
  caption: string;
  job: string;
  marriage: string;
  relation: string;
  story: string;
  lastAt: string;
};

/** 채팅할 수 있는 챕터 */
export type PlayableId = 'ch1' | 'ch2';

export function profileFor(
  id: PlayableId,
  saves: { ch1?: Chapter1Save; ch2?: Chapter2Save },
  fallbackLast?: string,
): Profile {
  if (id === 'ch2') {
    const s = saves.ch2;
    if (!s?.done) return locked('1920 대화 시 해금', fallbackLast);
    // 936:6670
    return {
      caption: '경성의 여성 화가',
      job: '화가',
      marriage: '조건을 걸었다',
      relation: '내 얘기를 공감해주는 사람',
      story: '네 가지 조건',
      lastAt: s.lastAt ?? fallbackLast ?? '—',
    };
  }
  const s = saves.ch1;
  if (!s?.done) return locked('1914 대화 시 해금', fallbackLast);
  // 936:6268
  return {
    caption: '동경의 유학생',
    job: '학생',
    marriage: '아직 하지 않았다.',
    relation: '흥미로운 이방인',
    story: '도쿄 유학길',
    lastAt: s.lastAt ?? fallbackLast ?? '—',
  };
}

function locked(caption: string, last?: string): Profile {
  return { caption, job: '???', marriage: '???', relation: '???', story: '—', lastAt: last ?? '—' };
}

/**
 * 초상 — 채팅 인물 그림(단독 PNG)을 챕터마다 다른 창에 잘라 넣는다
 *   ch1  254×267  잠김 (160, 301) / 해금 (153, 306)   923:4434 · 936:6268
 *   ch2  332×288  잠김 (122, 282) / 해금 (122, 284)   936:6819 · 936:6670
 * img 는 창 안에서의 위치와 폭 (Figma 시트 크롭과 같은 얼굴 위치가 되도록 환산)
 */
export type PortraitFrame = {
  box: { w: number; h: number; locked: [number, number]; open: [number, number] };
  img: { left: number; top: number; width: number };
};

export const PORTRAITS: Record<PlayableId, PortraitFrame> = {
  ch1: { box: { w: 254, h: 267, locked: [160, 301], open: [153, 306] }, img: { left: 5, top: -4.5, width: 257.9 } },
  ch2: { box: { w: 332, h: 288, locked: [122, 282], open: [122, 284] }, img: { left: 5.2, top: 5.9, width: 317.2 } },
};

/** 채팅 기록 보기 칸 (923:4529) — 作品 슬롯. 아직 연결 전이라 Figma 문구 그대로 */
export const RECORD_SLOTS = ['자화상', '소실', '?', '소실'] as const;

export const TABS = ['About her', 'Timeline', 'Library'] as const;

/* ===========================================================================
 * 과거 · 캐릭터 대시보드 (Figma 1136:4249 · 4476 · 4398)
 * ========================================================================= */

/** Chat history 창 종이 머리 — 1136:4435 */
export const HISTORY_HEADERS: Record<'prologue' | 'ch1' | 'ch2', string> = {
  prologue: 'Prologue | 첫 조우',
  ch1: '1914 | 도쿄 유학길',
  ch2: '1920 | 네 가지 조건',
};

/** 대시보드 칸 — 1136:4619 (WORK · WEDLOCK · BONDS) 와 OUR STORY · LAST SHEGNAL */
export type Dashboard = {
  /** value 가 없으면 "대화 시 해금" */
  rows: { label: string; value?: string }[];
  story: string;
  lastAt: string;
  /** 대화한 챕터가 하나라도 있는가 */
  unlocked: boolean;
};

/** 가장 최근에 마친 챕터의 모습으로 채운다. 아무것도 안 했으면 프롤로그 */
export function dashboardFor(saves: { ch1?: Chapter1Save; ch2?: Chapter2Save }, fallbackLast?: string): Dashboard {
  const id: PlayableId | null = saves.ch2?.done ? 'ch2' : saves.ch1?.done ? 'ch1' : null;
  if (!id) {
    return {
      rows: [{ label: 'Work' }, { label: 'Wedlock' }, { label: 'Bonds' }],
      story: 'Prologue · 첫 조우',
      lastAt: fallbackLast ?? '—',
      unlocked: false,
    };
  }
  const p = profileFor(id, saves, fallbackLast);
  return {
    rows: [
      { label: 'Work', value: p.job },
      { label: 'Wedlock', value: p.marriage },
      { label: 'Bonds', value: p.relation },
    ],
    story: id === 'ch2' ? '1920 · 네 가지 조건' : '1914 · 도쿄 유학길',
    lastAt: p.lastAt,
    unlocked: true,
  };
}

/** 초상 카드가 데려갈 챕터 — 아직 마치지 않은 가장 이른 챕터, 다 마쳤으면 마지막으로 간 곳 */
export function nextChapter(
  saves: { ch1?: Chapter1Save; ch2?: Chapter2Save },
  last?: PlayableId,
): { id: PlayableId; year: string; title: string; caption: string } {
  if (!saves.ch1?.done) return { id: 'ch1', year: '1914', title: '도쿄 유학길', caption: '1914 대화 시 해금' };
  if (!saves.ch2?.done) return { id: 'ch2', year: '1920', title: '네 가지 조건', caption: '1920 대화 시 해금' };
  const id = last ?? 'ch2';
  return id === 'ch1'
    ? { id, year: '1914', title: '도쿄 유학길', caption: '동경의 유학생' }
    : { id, year: '1920', title: '네 가지 조건', caption: '경성의 여성 화가' };
}
