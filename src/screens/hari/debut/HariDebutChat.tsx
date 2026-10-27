import type { HariChatSave } from '../../../game/types'
import HariStoryChat from '../chat/HariStoryChat'
import type { HariStoryStart } from '../chat/hariStoryTypes'
import { DEBUT_STORY } from './debutScript'

/**
 * 반하리 · 2023 「데뷔하면 제일 먼저」 — 화면은 챕터 공용 HariStoryChat, 대본은 debutScript.
 * 2020 에서 하리를 만났으면(met) 재회로 시작한다.
 */
type Props = {
  playerName: string
  save?: HariChatSave
  onSave: (next: HariChatSave) => void
  onExit: () => void
  onMain?: () => void
  met?: boolean
  background?: string
  startAt?: HariStoryStart
}

export default function HariDebutChat(props: Props) {
  return <HariStoryChat {...props} script={DEBUT_STORY} />
}
