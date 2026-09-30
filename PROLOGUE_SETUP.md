# Chapter 0 프롤로그 — 적용 안내

## 1. 파일 배치

```
src/screens/prologue/
  PrologueFlow.tsx        ← 진입점. 6단계 흐름 전체
  PrologueOpening.tsx     856:68
  PrologueQuote.tsx       856:71
  PrologueTitleCard.tsx   856:76
  PrologueArrival.tsx     856:94 + 856:797
  PrologueChat.tsx        856:178 / 575 / 219 / 484 / 511   ← 응접실 채팅
  PrologueEnding.tsx      856:537
  PrologueParts.tsx       배경 플레이트 · 배지 · 액자 공용
  ParlorParts.tsx         응접실 배경 · 상단바 · 캐릭터 · 타이핑 훅
  prologueScript.ts       오프닝~도착 대사
  chapter0Script.ts       응접실 대사 + 친밀도 (MD 이식)
  prologue.css
  chapter0.css
src/assets/prologue/
  atelier-exterior.png    ✅ 반영 완료
  chapter-banner.svg      ✅ 반영 완료
  notice-frame.svg        ✅ 반영 완료
  parlor-interior.webp    ✅ 반영 완료
  her-portrait.png        ✅ 반영 완료
```

## 1-b. 응접실 에셋 (반영 완료)

| 원본 | 처리 | 결과 |
|---|---|---|
| `부티크_전경.png` 14.6 MB / 3881x2757 | 가장자리 투명 → 종이톤 `#a6a49d` 로 메움, 3000px, WebP q88 | `parlor-interior.webp` **1.07 MB** |
| `나혜석_1.png` 0.40 MB / 850x2552 | 알파 유지, 255색 양자화 | `her-portrait.png` **69 KB** |

배경을 **WebP 로 바꾼 이유**는 파스텔 계조 때문입니다.
PNG 255색으로 줄이면 2.0 MB 인데 색이 띠처럼 뭉치고, WebP 는 1.07 MB 에 계조가 살아 있습니다.
Vite 가 `.webp` import 를 기본 지원하므로 설정은 필요 없습니다.

### 실루엣은 별도 에셋 없이 처리

`856:592` 의 실루엣은 전용 아트를 받지 못해, **같은 인물 PNG 를 CSS 로 눌러서** 씁니다.

```css
.pr-figure--silhouette {
  --pr-silhouette-dark: 0.18;   /* ← 농도 조절 */
  filter: blur(5.35px);
}
.pr-figure--silhouette img {
  filter: grayscale(1) brightness(var(--pr-silhouette-dark)) contrast(1.15);
}
```

시안보다 밝거나 어두우면 `--pr-silhouette-dark` 만 바꾸면 됩니다.
전용 아트가 생기면 `ParlorParts.tsx` 의 `HerFigure` 에서 `src` 만 갈아끼우세요.

## 2. 에셋 (반영 완료)

```
src/assets/prologue/
  atelier-exterior.png   1.03 MB   3000 x 2187
  chapter-banner.svg     121 KB    707 x 309
  notice-frame.svg        21 KB    520 x 310
```

보내주신 원본을 최적화해서 넣어뒀습니다.

| 파일 | 원본 | 처리 |
|---|---|---|
| `atelier-exterior.png` | 12.8 MB / 3719x2711 | 3000px 리사이즈 + 255색 양자화 → **1.03 MB** |
| `chapter-banner.svg` | 172 KB | 소수 1자리 반올림, 공백 제거 → **121 KB** (gzip 45 KB) |
| `notice-frame.svg` | 31 KB | 동일 처리 → **21 KB** (gzip 8 KB) |

### 원본과 달라진 두 가지 (중요)

**① 배경 회전을 뺐습니다.**
Figma 는 세로 원본을 `-90°` 회전해 쓰지만, 내보내주신 PNG 가 이미 가로라
`BgPlate` 에서 회전을 제거하고 `object-fit: cover` 로만 채웁니다.

**② `opacity: .7` 을 CSS 에서 뺐습니다.**
PNG 의 알파 최대값이 179(= 0.7)로, Figma 레이어 투명도가 이미 구워져 있습니다.
CSS 로 한 번 더 걸면 0.49 가 되어 너무 흐려집니다.

나중에 배경을 다시 내보내실 때 **불투명 원본**으로 뽑으시면
`prologue.css` 의 `.pr-bg-plate__img` 에 `opacity: .7` 을 되살려야 합니다.

### 액자는 SVG 로 교체

`856:80` 은 Figma 데이터상 solid 테두리지만 실제로는 손그림 질감이라,
CSS 테두리 대신 `notice-frame.svg` 를 씁니다.
SVG 내부 어두운 판이 `(37.65, 28)` 에서 시작하고 Figma 절대좌표가 `(739, 558)` 이라
좌상단을 `(701.35, 530)` 에 맞춰뒀습니다.

### 배너는 한 파일로 두 크기

`chapter-banner.svg` 하나를 타이틀 카드(704.992px)와 도착 화면(390px)이 공유합니다.
비율이 같아서 `--pr-badge-w` 만 바꾸면 라벨 크기·위치까지 따라갑니다.

## 3. 폰트

| Figma | 코드에서 쓰는 것 |
|---|---|
| Victor Mono Light | 이미 설치됨 |
| SM KMyungJo Std / SM JMyungJo Std | **상용 폰트라 미포함** → Nanum Myeongjo로 대체 표시 |
| Noto Serif KR Black | Google Fonts |

`index.html` 또는 전역 CSS에 추가:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&family=Noto+Serif+KR:wght@400;900&display=swap"
  rel="stylesheet"
/>
```

SM 명조를 실제로 쓰실 거면 `prologue.css`의 `--pr-font-myungjo` 맨 앞에 이미 이름이 들어가 있어서,
로컬에 폰트를 설치하고 `@font-face`만 추가하면 자동으로 우선 적용됩니다.

## 4. 연결

```tsx
import PrologueFlow from './screens/prologue/PrologueFlow';

<PrologueFlow
  onComplete={() => setScreen('chapter1')}
  onExit={() => setScreen('dashboard')}
/>
```

개발용 진입:

```tsx
// ?screen=prologue.chat
<PrologueFlow startAt="chat" onComplete={...} onExit={...} />
```

`startAt` 은 `opening | quote | title | arrival | chat | ending` 중 하나입니다.

Stage(1920×1080 비율 유지 스케일) 안에 넣으면 됩니다. 각 화면은 `position: absolute; inset: 0`
1920×1080 박스라 기존 화면들과 동일하게 동작합니다.

## 5. 응접실 채팅 (0.13 ~ 0.18)

여섯 프레임이 배경·배지·상단바를 공유하고 하단 UI 만 달라서,
화면을 쪼개지 않고 `PrologueChat.tsx` 하나가 단계 머신으로 돌립니다.

| 단계 | Figma | 화면 |
|---|---|---|
| `narration` | 856:178 | 나레이션 3줄. 그녀는 아직 없음 |
| `silhouette` | 856:575 | 실루엣 등장 + 첫 접촉 3줄 |
| `identity` | 856:219 | 정체 질문 2줄 + 입력창 |
| `chat` | 856:484 | 채팅 로그 (말풍선 ↔ 회색 답변) |
| `choice` | 856:511 | 2지선다 |
| `ending` | 856:537 | 종료 카드 (`PrologueEnding.tsx`) |

### 채팅 로그 해석

Figma 는 `856:506 / 508 / 510` 세 덩어리가 고정 좌표로 놓여 있지만,
실제로는 **아래에서 위로 쌓이는 로그**로 봤습니다.
하단 기준선을 862px 에 맞추고, 넘치면 위로 흘러가며 상단 90px 구간에서 서서히 사라집니다.

`0.15` 의 가운데 자막과 `0.16` 의 말풍선은 **같은 대사의 두 상태**입니다.
로그가 비어 있을 때는 자막으로, 유저가 답한 뒤에는 말풍선으로 옮겨갑니다.

### MD 이식 내용

`chapter0Script.ts` 는 `나혜석_챕터0_프롤로그.md` 를 코드로 옮긴 것입니다.

- **이름 비공개** — 프롤로그 어디에서도 "나혜석"을 말하지 않습니다. 마지막 줄은 다음을 약속만 합니다
- **친밀도** — 시작 8 / 턴당 최대 +1 / 상한 18. `applyIntimacy()` 가 세 겹으로 막습니다
- **나이 반응 1회** — `player.age` 로 서른아홉인 그녀와의 거리를 재고, `chat` 단계에서 한 번만 들어갑니다. 값이 없으면 그 줄을 통째로 생략합니다
- **선택지 동점** — 두 답의 친밀도가 같습니다. 정답이 있는 질문이 아닙니다
- **마무리 보너스** — 친밀도 13 이상일 때만 "…자네, 목소리가 나쁘지 않군." 한 줄이 붙습니다

개발 모드에서는 좌하단에 `INTIMACY 11 / 18 · NEUTRAL` 이 표시됩니다.

### 자유 입력 처리

`856:238` 입력은 **내용을 판정하지 않습니다.** 길이만 보고 세 유형으로 나눠 고정 대사로 받습니다.

| 유형 | 조건 | 친밀도 |
|---|---|---|
| `sincere` | 3자 이상 | +1 |
| `jest` | 1~2자 | 0 |
| `empty` | 공백 | 0 |

전시 환경에서 LLM 응답 지연과 이탈 대사를 피하기 위한 결정입니다.
실제 LLM 을 붙이려면 `classifyReply` / `REPLY_RESPONSE` 만 교체하면 됩니다.

## 6. 전환

`PrologueFlow.tsx`의 `STEP_TRANSITION`에 각 단계 진입 시 권장 전환을 적어뒀습니다.
현재는 컴포넌트를 바로 갈아끼우기만 하므로, 기존 Transition 래퍼로 감싸주세요.

| 구간 | 권장 |
|---|---|
| 오프닝 → 인용구 | `ascii` (신호가 잡히는 느낌) |
| 인용구 → 타이틀 카드 | `crt` (배경 톤이 세피아로 바뀌는 지점) |
| 타이틀 카드 → 도착 | `fade` |
| 들어간다 → 응접실 | `crt` |
| 선택지 → 종료 카드 | `fade` |

## 7. 진행 방식

| 화면 | 진행 |
|---|---|
| 856:68 오프닝 | 로그 7줄 자동 → 1.8초 대기 후 자동. 클릭 시 스킵 |
| 856:71 인용구 | 3줄 자동 → 자동. 클릭 시 스킵 |
| 856:76 타이틀 카드 | 3.4초 후 자동. 클릭 시 스킵 |
| 856:94 → 856:797 도착 | 클릭/스페이스/엔터로 한 줄씩. 타이핑 중 누르면 즉시 완성 |
| 들어간다 | 버튼 또는 엔터 |

## 8. 0.1번 대사

`prologueScript.ts`의 `ARRIVAL_LINES` 7줄입니다. 전부 주인공 쪽 시점이고,
회색 서술(`narration`)과 흰색 속마음(`inner`)이 번갈아 나오도록 배치했습니다.

```
 눈을 떴을 때, 세상은 온통 잿빛 스케치 같았다.          (Figma 원본)
(여긴… 어디지? 방금까지 분명 다른 곳에 있었는데.)        (Figma 원본)
 손끝에 닿는 공기가 서늘하다. 꿈이라기엔 너무 또렷하다.
(종이 냄새… 아니, 기름 냄새인가.)
 문틈으로 희미한 불빛이 샌다. 안에 누군가 있다.
(…돌아가는 길은, 아무래도 보이지 않는다.)
(…한번, 들어가 볼까.)                                   (Figma 원본 · 856:797)
```

추가한 5줄은 "잿빛 스케치" 톤을 이어가면서 **들어갈 이유**를 만들도록 썼습니다.
뒤로 돌아갈 수 없다 → 안에 누가 있다 → 들어가 본다 순서입니다.
줄을 더하거나 빼도 화면은 그대로 동작합니다.

## 9. 검증

Vite 8 + React 19 + TypeScript 새 프로젝트에 그대로 넣어 확인했습니다.

```
tsc --noEmit   통과
vite build     통과 (27 modules, 203ms)
```

## 10. 남은 것

- `856:192` `856:193` 우측 버튼 두 개는 빈 상태입니다. 기능(기록/설정)이 정해지면 연결하면 됩니다
- `이어서 진행` → 챕터 1 화면이 아직 없습니다. `onComplete` 만 비어 있습니다

- `들어간다` 이후의 아뜰리에 내부 화면은 아직 없습니다. `onEnterAtelier`만 비워둔 상태입니다.
- 상단 내레이션 바(856:108)는 지금 고정 문구 하나입니다. 대사에 따라 바뀌어야 하면
  `ARRIVAL_LINES`에 `header` 필드를 추가하는 쪽이 간단합니다.
