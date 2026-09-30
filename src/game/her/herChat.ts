/**
 * 나혜석 대화 호출
 *
 * 브라우저에서 직접 Anthropic API 를 부르지 않는다. API 키가 노출되기 때문에
 * 로컬 프록시(`/api/chat`)를 거친다. `server/chat-proxy.mjs` 참고.
 *
 * 전시 환경을 전제로 세 겹의 안전장치를 둔다.
 *   1. 타임아웃  — 지정 시간을 넘으면 즉시 고정 대사로 폴백
 *   2. 출력 검사 — 이름·연도·말투 이탈이면 폴백
 *   3. 실패 폴백 — 네트워크가 끊겨도 흐름이 멈추지 않는다
 */

import type { Player } from '../../screens/prologue/chapter0Script';
import { buildSystemPrompt, cleanReply, validateReply } from './chapter0Persona';

export type Turn = { role: 'user' | 'assistant'; content: string };

export type ChatResult = {
  text: string;
  /** true 면 LLM 응답, false 면 고정 대사 폴백 */
  live: boolean;
  reason?: string;
};

export const CHAT_CONFIG = {
  endpoint: '/api/chat',
  /** 이 시간을 넘기면 폴백. 전시에서는 3초가 한계다 */
  timeoutMs: 3500,
  /** 프롤로그에서 자유 대화로 돌릴 턴 수 */
  freeTurns: 2,
} as const;

export async function askHer(
  player: Player,
  intimacy: number,
  history: Turn[],
  fallback: string,
): Promise<ChatResult> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), CHAT_CONFIG.timeoutMs);

  try {
    const res = await fetch(CHAT_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        system: buildSystemPrompt(player, intimacy),
        messages: history,
        maxTokens: 200,
      }),
    });

    if (!res.ok) return { text: fallback, live: false, reason: `http:${res.status}` };

    const data: { text?: string } = await res.json();
    const cleaned = cleanReply(data.text ?? '');
    const check = validateReply(cleaned);

    if (!check.ok) {
      if (import.meta.env.DEV) {
        console.warn('[herChat] 폴백:', check.reason, '|', cleaned);
      }
      return { text: fallback, live: false, reason: check.reason };
    }
    return { text: cleaned, live: true };
  } catch (e) {
    const reason = e instanceof DOMException && e.name === 'AbortError' ? 'timeout' : 'network';
    return { text: fallback, live: false, reason };
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * 자유 대화 턴이 끝났을 때 그녀가 대화를 닫는 말.
 * LLM 이 무한히 이어지지 않도록 호출부가 이 줄로 마무리한다.
 */
export const FREE_TURN_CLOSERS = [
  '…그만합시다. 더 물으면 내가 대답할 말이 없소.',
  '됐소. 그 이야긴 여기까지 하지.',
] as const;
