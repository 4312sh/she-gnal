# 챕터 1 · 2 — 반영 안내

(챕터 2 · 네 가지 조건은 아래 별도 절)

## 챕터 1 · 도쿄 유학길

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

## 그림 · 테두리

받은 원본을 화면 크기에 맞게 줄여 넣었다.

| 파일 | 원본 | 쓰는 곳 |
|---|---|---|
| `src/assets/chapter1/room-sketch.webp` | 책상_의자.png | 챕터 1 배경 (blur 4.44px · 70% 는 CSS) |
| `src/assets/chapter1/her-1914.png` | 1913-1919_혜석_1.png | 챕터 1 인물 · 캐릭터 화면 초상 (잠기면 실루엣) |
| `src/assets/figures/her-1920.png` 외 | 1920-1927 / 1928-1935 / 1939- · 이젤.png | 다음 챕터용으로 보관 (아직 안 씀) |
| `src/assets/ui/header-bar.svg` | 타이틀_바.svg | 채팅 상단 바 (프롤로그도 같이 바뀜) |
| `src/assets/ui/tab.svg` · `tab-dim.svg` | 박스_3.svg | 캐릭터 탭 (활성 / 비활성) |
| `src/assets/ui/record-slot.svg` | 박스_4.svg | 채팅 기록 칸 |
| `src/assets/ui/tuning-box.svg` | 박스_5.svg | 접속 정보 판 |
| `src/assets/ui/section-bar.svg` | 박스_6.svg | 대시보드 · 스토리 헤더 |
| `src/assets/ui/square.svg` | 박스_7.svg | 헤더 옆 작은 네모 |
| `src/assets/ui/story-row*.svg` | 챕터_박스.svg | 스토리 칸 (기본 / 선택 / 잠김 — 색만 바꾼 변형) |
| `src/assets/ui/dashboard-box*.svg` | 박스_2.svg | 대시보드 판 (기본 / 스토리 선택 시 황토색) |
| `src/assets/character/portrait-frame.svg` | 박스_1.svg | 초상 액자 |

제목.svg · 과거_설명.svg 는 이미 쓰고 있는 배너 · 액자(`prologue/chapter-banner.svg`, `notice-frame.svg`)와 같은 부품이라 그대로 두었다.
늘려 쓰는 SVG 에는 `preserveAspectRatio="none"` 을 넣었다 (칸 높이가 달라도 폭이 줄지 않게).

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

---

## 챕터 2 · 네 가지 조건

### 흐름

캐릭터 화면 스토리 "네 가지 조건" 을 누르면 초상 · 프로필 · 접속 정보가 1920년 기준으로 바뀐다.
초상 카드를 누르거나 같은 칸을 한 번 더 누르면 들어간다.

접속 튜닝(935:5569) → 타이틀 카드(935:5572) → 그녀가 먼저 맞음(930:5328)
→ 채팅 6턴(930:5363): 작품 → 긍지 → 신문 → 조건 세 개 → "당신이라면?" → 공감 · 반박
→ 주 선택지(935:5523) → 이어지는 대화 (4턴째에 작품 선택지 한 번) → 나가기(935:5598)

- 챕터 1 에서 이름을 나눴으면 "도쿄 하숙방 앞에서 전보를 건네던… ○○ 씨 아니오?" 로 알아본다. 아니면 처음 보는 손님
- 처음 몇 턴 안에 결혼 · 혼인 · 신문 이야기를 먼저 꺼내면 그림 이야기를 건너뛰고 신문 단계로 간다

### 바로 보기

| 주소 뒤에 붙일 것 | 화면 |
|---|---|
| `?screen=chapter2` | 접속 튜닝부터 |
| `?screen=chapter2&at=scene.opening` | 첫 대사부터 |
| `?screen=chapter2&at=scene.chat` | 채팅부터 |
| `?screen=chapter2&at=scene.choice` | 주 선택지부터 |
| `?screen=chapter2&at=scene.after` | 이어지는 대화 (4번째 답 뒤 작품 선택지) |

### 그림

| 파일 | 원본 | 쓰는 곳 |
|---|---|---|
| `src/assets/chapter2/studio-sketch.webp` | 이젤.png | 배경 (930:5330, blur 없음) |
| `src/assets/chapter2/her-1920.png` | 1920-1927_혜석_1.png | 인물 · 캐릭터 화면 초상 (잠기면 실루엣) |

### Figma 에서 바로잡은 것

- 튜닝 YEAR `昭和 10 · 1914` → `大正 9 · 1920`
- 채팅 · 선택지 · 모달 배지 `Chaptor 0. Prologue.` → `1920. 네 가지 조건`
- 채팅 상단 바의 프롤로그 문구 → 챕터 2 장면 문구

### 저장

`she-gnal:player` 의 `chapter2` — `done` · `choice` · `exhibit` · `unlocks` · `lastAt`.
`lastChapter` 는 마지막으로 들어간 챕터라, 캐릭터 화면이 그 챕터를 먼저 보여 준다.
