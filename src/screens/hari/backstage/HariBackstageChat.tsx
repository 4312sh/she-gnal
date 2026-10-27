import type { HariChatSave } from '../../../game/types'
import HariStoryChat from '../chat/HariStoryChat'
import type { HariStoryStart } from '../chat/hariStoryTypes'
import { BACKSTAGE_STORY } from './backstageScript'

/**
 * 반하리 · 2024 「새벽 3시, 편의점 앞」 — 화면은 챕터 공용 HariStoryChat, 대본은 backstageScript.
 * 2020 이나 2023 에서 하리를 만났으면(met) 그 목소리를 알아본다.
 */
type Props = {
  playerName: string
  save?: HariChatSave
  onSave: (next: HariChatSave) => void
  onExit: () => void
  onMain?: () => void
  met?: boolean
  startAt?: HariStoryStart
}

export default function HariBackstageChat(props: Props) {
  return <HariStoryChat {...props} script={BACKSTAGE_STORY} />
}
