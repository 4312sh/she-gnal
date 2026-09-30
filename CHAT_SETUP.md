# 나혜석 자유 대화 — 붙이는 법

## 1. API 키

프로젝트 루트에 `.env` 를 만듭니다. **git 에 올리지 마세요.**

```
ANTHROPIC_API_KEY=sk-ant-...
```

`.gitignore` 에 `.env` 가 있는지 확인하세요. 없으면 한 줄 추가합니다.

키는 https://console.anthropic.com 에서 발급합니다.

## 2. 프록시 연결

API 키를 브라우저에 두면 누구나 가져갈 수 있어서, 서버를 한 겹 둡니다.
`server/chat-proxy.mjs` 가 그 역할을 합니다.

`vite.config.ts` 에 세 줄을 넣으면 `npm run dev` 만으로 같이 뜹니다.

```ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { chatProxyPlugin } from './server/chat-proxy.mjs';

export default defineConfig(({ mode }) => {
  // .env 의 ANTHROPIC_API_KEY 를 프록시가 읽을 수 있게 주입
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return { plugins: [react(), chatProxyPlugin()] };
});
```

빌드 결과물(`dist`)을 서빙할 때는 프록시를 따로 띄웁니다.

```bash
node server/chat-proxy.mjs        # http://localhost:8787/api/chat
```

이 경우 `herChat.ts` 의 `CHAT_CONFIG.endpoint` 를
`http://localhost:8787/api/chat` 로 바꾸거나, 정적 서버에 프록시 설정을 겁니다.

## 3. 모델

기본값은 **Haiku 4.5** 입니다. 전시에서는 속도가 품질보다 중요해서입니다.

```bash
SHEGNAL_MODEL=claude-sonnet-5 npm run dev   # 페르소나 유지력 우선
```

Sonnet 으로 바꾸면 응답이 2~4초로 늘어나므로
`herChat.ts` 의 `timeoutMs` 도 5000 정도로 올려야 폴백이 덜 걸립니다.

## 4. 동작 구조

```
유저 입력
   ↓
/api/chat  ──→  Anthropic API
   ↓              (3.5초 안에 응답 없으면 중단)
cleanReply()    따옴표·지문·이름표 제거
   ↓
validateReply() 통과 → 그대로 출력
                실패 → 고정 대사로 폴백
```

**세 겹의 안전장치**가 걸려 있어서, 서버가 없거나 네트워크가 끊겨도
프롤로그 흐름은 멈추지 않습니다. 고정 대사로 이어집니다.

### 폴백 조건

| reason | 내용 |
|---|---|
| `timeout` | 3.5초 초과 |
| `network` / `http:xxx` | 서버 · API 오류 |
| `forbidden:나혜석` | 이름·고유명사 발설 |
| `year` | 1896 / 1927 같은 구체 연도 |
| `modern` | ~요 / ~습니다 / ~에요 |
| `chat-speak` | ㅋㅋ / ㅎㅎ / ~~ |
| `emoji` | 이모지 |
| `register` | 하오체 표지가 전혀 없음 |
| `too-long` | 160자 초과 |
| `empty` | 빈 응답 |

개발 모드에서는 폴백이 걸릴 때 콘솔에 이유와 원문이 찍힙니다.
좌하단 표시에도 `LIVE` / `FALLBACK` 이 나옵니다.

## 5. 자유 대화 범위

프롤로그 **전체를 LLM 에 맡기지 않습니다.** 정해진 뼈대 안에서 일부만 자유입니다.

```
나레이션 3줄        고정
실루엣 3줄          고정
정체 질문 2줄       고정
─────────────────────────
자유 대화 2턴       LLM       ← 여기만
─────────────────────────
공간 이야기 3~4줄    고정
선택지              고정
마무리 2~3줄        고정
```

턴 수는 `herChat.ts` 의 `CHAT_CONFIG.freeTurns` 로 조절합니다.
2턴이면 대략 20~30초가 늘어납니다. 1분 목표라면 2턴이 상한입니다.

자유 대화가 끝나면 `FREE_TURN_CLOSERS` 의 한 줄로 그녀가 대화를 닫고
고정 흐름으로 돌아갑니다. 무한히 이어지지 않습니다.

## 6. 페르소나 수정

`src/game/her/chapter0Persona.ts` 의 `buildSystemPrompt()` 가 실제 프롬프트입니다.
`나혜석_챕터0_프롤로그.md` 를 코드로 옮긴 것이라, **문서를 고치면 여기도 같이 고쳐야 합니다.**

발설 금지어를 추가하려면 `FORBIDDEN_TERMS` 배열에 넣으세요.
프롬프트와 출력 필터가 같은 배열을 씁니다.

## 7. 전시 전 점검

- [ ] `.env` 에 키가 있고 `.gitignore` 에 `.env` 가 있는가
- [ ] 네트워크를 끊고 돌려봤는가 (폴백으로 끝까지 진행되어야 함)
- [ ] 장난 입력·막말을 넣어봤는가
- [ ] 이름을 캐물어봤는가 (끝까지 안 알려줘야 함)
- [ ] 관람객 1인당 호출 2회 × 예상 인원으로 비용을 계산했는가
- [ ] 프록시의 분당 40회 제한(`RATE`)이 현장 인원에 맞는가
