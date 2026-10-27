import type { Era } from './eras'
import type { ScreenId } from './types'

/**
 * 타임머신(시간대 설정)에서 갈 수 있는 연도 — 그 연도에 대화가 있는 채팅만.
 * 연도를 정확히 맞춰야 들어가고, 없으면 가장 가까운 연도를 권한다 (TimeSetup 경고창).
 * 새 채팅이 생기면 여기에 한 줄 추가하면 된다.
 */
export type Destination = {
  year: number
  eraId: Era['id']
  screen: ScreenId
  /** LAST SHEGNAL 의 CHAPTER 번호 */
  chapter: number
  /** 과거 캐릭터 화면이 처음 보여 줄 챕터 */
  lastChapter?: 'ch1' | 'ch2'
}

export const DESTINATIONS: Destination[] = [
  { year: 1914, eraId: 'past', screen: 'chapter1', chapter: 1, lastChapter: 'ch1' }, // 도쿄 유학길
  { year: 1920, eraId: 'past', screen: 'chapter2', chapter: 2, lastChapter: 'ch2' }, // 네 가지 조건
  { year: 1935, eraId: 'past', screen: 'prologue', chapter: 0 }, // 첫 조우 · 경성
  { year: 2020, eraId: 'present', screen: 'hariTrainee', chapter: 1 }, // 독기 충만 연습생
  { year: 2023, eraId: 'present', screen: 'hariDebut', chapter: 2 }, // 데뷔하면 제일 먼저
  { year: 2024, eraId: 'present', screen: 'hariBackstage', chapter: 3 }, // 새벽 3시, 편의점 앞
  { year: 2026, eraId: 'present', screen: 'hariPrologue', chapter: 0 }, // 공연장 뒷편의 대기실
  { year: 2999, eraId: 'future', screen: 'eioPrologue', chapter: 0 }, // 고대 신호
]

/** 그 연도에 바로 들어갈 수 있는 채팅 */
export function destinationFor(year: number): Destination | undefined {
  return DESTINATIONS.find((d) => d.year === year)
}

/** 가장 가까운 연도의 채팅 (거리가 같으면 이른 연도) */
export function nearestDestination(year: number): Destination {
  return DESTINATIONS.reduce((best, d) => (Math.abs(d.year - year) < Math.abs(best.year - year) ? d : best))
}
