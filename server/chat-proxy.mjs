/**
 * Anthropic API 로컬 프록시
 *
 * API 키가 브라우저에 노출되지 않도록 서버를 한 겹 둔다.
 * 사용법은 두 가지.
 *
 *   1) Vite 개발 서버에 붙이기 (권장)
 *      vite.config.ts 에서 chatProxyPlugin() 을 plugins 에 추가한다.
 *      → npm run dev 만 치면 /api/chat 이 같이 뜬다.
 *
 *   2) 단독 실행 (빌드 결과물을 서빙할 때)
 *      node server/chat-proxy.mjs
 *      → http://localhost:8787/api/chat
 *
 * .env 파일에 키를 둔다 (git 에 올리지 말 것):
 *   ANTHROPIC_API_KEY=sk-ant-...
 */

import http from 'node:http';

const API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * 전시용 기본값은 Haiku.
 * 응답이 1초 안쪽이라 체류 시간이 짧은 환경에 맞다.
 * 페르소나 유지력을 더 원하면 'claude-sonnet-5' 로 바꾸되
 * herChat.ts 의 timeoutMs 도 같이 늘려야 한다.
 */
const MODEL = process.env.SHEGNAL_MODEL || 'claude-haiku-4-5-20251001';

/** 한 관람객이 과도하게 호출하지 못하도록 하는 아주 단순한 제한 */
const RATE = { windowMs: 60_000, max: 40 };
const hits = [];

function rateLimited() {
  const now = Date.now();
  while (hits.length && now - hits[0] > RATE.windowMs) hits.shift();
  if (hits.length >= RATE.max) return true;
  hits.push(now);
  return false;
}

async function handleChat(body) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { status: 500, json: { error: 'ANTHROPIC_API_KEY 가 없습니다' } };
  if (rateLimited()) return { status: 429, json: { error: 'rate limited' } };

  const { system, messages, maxTokens } = body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 400, json: { error: 'messages 가 비어 있습니다' } };
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: Math.min(Number(maxTokens) || 200, 400),
      temperature: 0.8,
      system,
      messages: messages.slice(-12).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content ?? '').slice(0, 500),
      })),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return { status: res.status, json: { error: 'upstream', detail: detail.slice(0, 300) } };
  }

  const data = await res.json();
  const text = (data.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  return { status: 200, json: { text } };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 64_000) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('bad json'));
      }
    });
    req.on('error', reject);
  });
}

/** Vite 플러그인 — vite.config.ts 의 plugins 에 넣는다 */
export function chatProxyPlugin() {
  return {
    name: 'shegnal-chat-proxy',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        try {
          const body = await readBody(req);
          const out = await handleChat(body);
          res.statusCode = out.status;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(out.json));
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: String(e?.message ?? e) }));
        }
      });
    },
  };
}

/* ---- 단독 실행 ------------------------------------------------------- */

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = Number(process.env.PORT) || 8787;
  http
    .createServer(async (req, res) => {
      res.setHeader('access-control-allow-origin', '*');
      res.setHeader('access-control-allow-headers', 'content-type');
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
      }
      if (req.url !== '/api/chat' || req.method !== 'POST') {
        res.statusCode = 404;
        return res.end();
      }
      try {
        const body = await readBody(req);
        const out = await handleChat(body);
        res.statusCode = out.status;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(out.json));
      } catch (e) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: String(e?.message ?? e) }));
      }
    })
    .listen(port, () => {
      console.log(`chat proxy  http://localhost:${port}/api/chat  (${MODEL})`);
      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('경고: ANTHROPIC_API_KEY 가 설정되지 않았습니다');
      }
    });
}
