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
  lastPlayed?: { eraId: string; chapter: number; at: string }
  unlockedMemories?: string[]
  /** 챕터 1 · 도쿄 유학길 진행 기록 (나혜석_챕터1_도쿄유학길.md) */
  chapter1?: Chapter1Save
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
	
