# 챕터 1 · 도쿄 유학길 — 반영 안내

## 흐름

프롤로그 종료 "이어서 진행" → **캐릭터 화면** → 초상 카드 클릭 (또는 스토리 "도쿄 유학길" 두 번)
→ 접속 튜닝 → 타이틀 카드 → 그녀의 첫 대사 → 채팅 6턴 → 전보 선택 → 이름 나누기 → 끝나지 않는 대화
→ 우상단 오른쪽 네모 (또는 Esc) → "채팅을 중단할까요?" → 여기까지 → 캐릭터 화면

## 바로 보기 (개발용 주소)

| 주소 뒤에 붙일 것 | 화면 |
|---|---|
| `?screen=character` | 캐릭터 · About her |
| `?screen=chapter1` | 접속 튜닝부터 |
| `?screen=chapter1&at=scene.opening` | 그녀의 첫 대사부터 |
| `?screen=chapter1&at=scene.chat` | 채팅부터 |
| `?screen=chapter1&at=scene.choice` | 전보 선택지부터 |
| `?screen=chapter1&at=scene.after` | 이름 나눈 뒤 이어지는 대화 |

좌하단 `CH1 · 단계 · LIVE / FALLBACK` 은 개발 모드에서만 보인다.

## 그림 넣기 (Figma → PNG 2x)

넣기만 하면 코드 수정 없이 바뀐다. 없으면 프롤로그 그림이 자리를 채운다.

| 파일 | Figma 레이어 |
|---|---|
| `src/assets/chapter1/room-sketch.png` | 929:5256 "image 30" (하숙방 스케치) |
| `src/assets/chapter1/her-1914.png` | 929:5282 "챕터 1" (열여덟 살 그녀) |
| `src/assets/character/portrait-1914.png` | 936:6419 "챕터 2" (해금된 초상) |
| `src/assets/character/portrait-1914-locked.png` | 936:6264 "챕터 2" (잠긴 초상) |

그림 파일을 넣은 뒤에는 `npm run dev` 를 한 번 껐다 켠다.

## 파일

- `src/screens/character/` — 캐릭터 화면 (923:4434 · 936:6268)
- `src/screens/chapter1/` — 접속 · 타이틀 · 채팅 · 선택지 · 중단 모달
- `src/game/her/chapter1Persona.ts` — 시스템 프롬프트 · 출력 검사 · 폴백 (MD v2 그대로)
- `src/game/her/herChat.ts` — 챕터 공용 호출 `askHerWith` 추가 (프롤로그 `askHer` 는 그대로)
- `src/game/types.ts` — `chapter1` 저장값
- `src/App.tsx` — character / chapter1 화면 연결, 프롤로그 완료 → 캐릭터 화면
- `src/screens/prologue/` — `ParlorChrome` 배너 문구를 바꿀 수 있게 함, 기존 타입 오류(ChatStage) 수정
- `server/chat-proxy.d.mts` — 프록시 타입 선언 (npm run build 통과용)
- `index.html` — 나눔명조 · Noto Serif KR 폰트
