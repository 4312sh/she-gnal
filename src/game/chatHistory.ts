import { useEffect, useState } from 'react'

import { today } from './date'

/**
 * 채팅 기록 — 캐릭터 화면 "Chat history" 에서 다시 읽는 대화
 *
 * 챕터마다 접속(세션) 단위로 쌓는다. 한 접속 안에서는 로그가 늘 때마다 덮어쓴다.
 * localStorage 'she-gnal:history' — 플레이어 기록과 따로 둔다 (지우기도 따로)
 */

export type HistoryChapter = 'prologue' | 'ch1' | 'ch2'

/** 저장 칸 — 나혜석 챕터 + 하리 스토리 (하리 쪽은 HistoryChapter 에 넣지 않는다: 나혜석 캐릭터 화면이 그 타입으로 칸을 고른다) */
export type HistoryKey = HistoryChapter | 'hariPrologue' | 'hari2020' | 'hari2023' | 'hari2024' | 'eioPrologue'

export type HistoryLine = { from: 'her' | 'you'; text: string }

/** at: yyyy.m.d (보여 주는 날짜) · ts: 마지막으로 기록한 시각 (ms) — 같은 날 대화끼리 순서를 가린다 */
export type HistorySession = { id: string; at: string; ts?: number; lines: HistoryLine[] }

type Store = Partial<Record<HistoryKey, HistorySession[]>>

const KEY = 'she-gnal:history'
/** 챕터당 보관하는 최대 줄 수 — 넘치면 오래된 접속부터 버린다 */
const MAX_LINES = 400

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* 저장 공간이 없으면 기록만 건너뛴다 */
  }
}

export function loadHistory(chapter: HistoryKey): HistorySession[] {
  return read()[chapter] ?? []
}

export function recordSession(chapter: HistoryKey, sessionId: string, lines: HistoryLine[]) {
  if (!lines.length) return
  const store = read()
  const sessions = [...(store[chapter] ?? [])]
  const i = sessions.findIndex((s) => s.id === sessionId)
  const next: HistorySession = { id: sessionId, at: today(), ts: Date.now(), lines }
  if (i >= 0) sessions[i] = next
  else sessions.push(next)

  let total = sessions.reduce((n, s) => n + s.lines.length, 0)
  while (sessions.length > 1 && total > MAX_LINES) {
    total -= sessions[0].lines.length
    sessions.shift()
  }
  store[chapter] = sessions
  write(store)
}

/** 채팅 화면에서 로그가 바뀔 때마다 이번 접속 기록을 갱신한다 */
export function useRecordHistory(chapter: HistoryKey, log: { from: 'her' | 'you'; text: string }[]) {
  const [sessionId] = useState(() => Date.now().toString(36))
  useEffect(() => {
    recordSession(
      chapter,
      sessionId,
      log.map(({ from, text }) => ({ from, text })),
    )
  }, [chapter, sessionId, log])
}
