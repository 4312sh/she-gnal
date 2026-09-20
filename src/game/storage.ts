import type { Player } from './types'

const KEY = 'she-gnal:player'

export function loadPlayer(): Partial<Player> | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Partial<Player>) : null
  } catch {
    return null
  }
}

export function savePlayer(player: Partial<Player>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(player))
  } catch {
    // storage unavailable (private mode 등) — 진행에는 영향 없음
  }
}
