import type { Chapter1Save } from '../../game/types';

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
  { id: 'ch2', year: '1920', title: '네 가지 조건' },
  { id: 'ch4a', year: '?', title: '팔리지 않는 그림', locked: true },
  { id: 'ch4b', year: '?', title: '유럽 세계', locked: true },
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

export function profileFrom(ch1?: Chapter1Save, fallbackLast?: string): Profile {
  if (!ch1?.done) {
    return {
      caption: '1914 대화 시 해금',
      job: '???',
      marriage: '???',
      relation: '???',
      story: '—',
      lastAt: fallbackLast ?? '—',
    };
  }
  return {
    caption: '동경의 유학생',
    job: '학생',
    marriage: '아직 하지 않았다.',
    relation: '흥미로운 이방인',
    story: '도쿄 유학길',
    lastAt: ch1.lastAt ?? fallbackLast ?? '—',
  };
}

/** 채팅 기록 보기 칸 (923:4529) — 作品 슬롯. 아직 연결 전이라 Figma 문구 그대로 */
export const RECORD_SLOTS = ['자화상', '소실', '?', '소실'] as const;

export const TABS = ['About her', 'Timeline', 'Library'] as const;
