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
	
