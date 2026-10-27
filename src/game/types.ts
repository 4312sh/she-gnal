import type { TargetTime } from './eras'

export type Gender = 'woman' | 'man'

export type Player = {
  name: string
  age: number
  gender?: Gender
  /** Last time coordinates the player entered on the dashboard. */
  target?: TargetTime
  eraId?: 'past' | 'present' | 'future'
  /** Chapters finished, e.g. "past:0". */
  completedChapters?: string[]
  /** 마지막 접속 — year 는 타임머신에 친 연도 (없으면 시대 기준 연도) */
  lastPlayed?: { eraId: string; chapter: number; at: string; year?: number }
  unlockedMemories?: string[]
  /** 챕터 1 · 도쿄 유학길 진행 기록 (나혜석_챕터1_도쿄유학길.md) */
  chapter1?: Chapter1Save
  /** 챕터 2 · 네 가지 조건 진행 기록 (나혜석_챕터2_네가지조건.md) */
  chapter2?: Chapter2Save
  /** 캐릭터 화면이 처음 보여 줄 챕터 — 마지막으로 들어간 챕터 */
  lastChapter?: 'ch1' | 'ch2'
  /** 반하리 · 2020 독기 충만 연습생 진행 기록 */
  hariTrainee?: HariTraineeSave
  /** 반하리 · 프롤로그 공연장 뒷편의 대기실 진행 기록 (choice: stage | backstage) */
  hariPrologue?: HariChatSave
  /** 반하리 · 2023 데뷔하면 제일 먼저 진행 기록 */
  hariDebut?: HariChatSave
  /** 반하리 · 2024 새벽 3시, 편의점 앞 진행 기록 (choice: saw | pretended) */
  hariBackstage?: HariChatSave
  /** 이오 · 프롤로그 「고대 신호」 진행 기록 */
  eioPrologue?: EioPrologueSave
}

export type Chapter1Save = {
  /** 이름을 나누는 장면까지 봤는가 */
  done: boolean
  /** 전보 선택지 — A 설득해 보세요 / B 돌아가지 마세요 */
  choice?: 'A' | 'B'
  /** 서로 이름을 나눴는가. 다른 챕터의 첫인사가 여기에 따라 갈린다 */
  nameShared: boolean
  /** 챕터 1 에서 플레이어가 알려 준 이름 */
  sharedName?: string
  /** 알게 된 것 (고향 · 性情 · 호칭) */
  unlocks: string[]
  /** 마지막 접속 (yyyy.m.d) */
  lastAt?: string
}

export type Chapter2Save = {
  /** 주 선택지까지 봤는가 */
  done: boolean
  /** 주 선택지 — A 사랑하니까 / B 사랑만으로는 */
  choice?: 'A' | 'B'
  /** 작품 선택지 — A 고향 풍경 / B 조조 판화 */
  exhibit?: 'A' | 'B'
  unlocks: string[]
  lastAt?: string
}

export type HariTraineeSave = {
  /** 선택지까지 봤는가 */
  done: boolean
  /** 꿈 하나 보고 다 내려놓는 거 — 용기 / 무모 */
  choice?: 'courage' | 'reckless'
  /** 대화 중 밝힌 이름 */
  sharedName?: string
  /** 마지막 접속 (yyyy.m.d) */
  lastAt?: string
}

/** 하리 스토리 대화 공용 저장 형식 (HariStoryChat). choice 는 챕터마다 다른 선택지 id */
export type EioPrologueSave = {
  /** 선택지까지 봤는가 */
  done: boolean
  /** 알려 준 단어 — lonely 외로움 / longing 그리움 */
  word?: 'lonely' | 'longing'
  /** 이름 나누기에서 알려 준 이름 */
  sharedName?: string
  /** 이오가 학습한 고대어 (다음 챕터로 넘긴다) */
  learned?: string[]
  /** 마지막 접속 (yyyy.m.d) */
  lastAt?: string
}

export type HariChatSave = {
  done: boolean
  choice?: string
  sharedName?: string
  lastAt?: string
}

export type ScreenId =
  | 'title'
  | 'enterName'
  | 'chooseGender'
  | 'howToPlay'
  | 'boot'
  | 'bg1'
  | 'bg2'
  | 'bg3'
  | 'dashboard'
  | 'timeSetup'
  | 'timeReady'
  | 'signal1'
  | 'signal2'
  | 'signal3'
  | 'prologue'
  | 'character'
  | 'chapter1'
  | 'chapter2'
  | 'hariCharacter'
  | 'hariTrainee'
  | 'hariDebut'
  | 'hariBackstage'
  | 'hariPrologue'
  | 'eioCharacter'
  | 'eioPrologue'
  | 'viewCharacter'
	
