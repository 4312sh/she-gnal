import type { HariTraineeSave } from '../../../game/types'
import HariStoryChat from '../chat/HariStoryChat'
import type { HariStoryStart } from '../chat/hariStoryTypes'
import { TRAINEE_STORY } from './hariTraineeScript'

/**
 * 반하리 · 2020 「독기 충만 연습생」 — Figma 1200:13671 / 1200:13761 / 1200:13801
 *
 * 화면 · 흐름은 챕터 공용 HariStoryChat 이 맡고, 여기서는 2020 대본(hariTraineeScript)만 끼운다.
 */

export type TraineeStart = HariStoryStart

type Props = {
  playerName: string
  save?: HariTraineeSave
  onSave: (next: HariTraineeSave) => void
  onExit: () => void
  onMain?: () => void
  /** 전신 일러스트 — 나중에 받는 그림 (png · webp · webm · mp4) */
  figure?: string
  background?: string
  startAt?: TraineeStart
}

export default function HariTraineeChat({ figure, onSave, ...rest }: Props) {
  const script = figure ? { ...TRAINEE_STORY, figure: { ...TRAINEE_STORY.figure!, src: figure } } : TRAINEE_STORY
  return <HariStoryChat {...rest} script={script} onSave={(s) => onSave(s as HariTraineeSave)} />
}
