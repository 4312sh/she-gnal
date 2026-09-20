# She-gNAL: Tune Into Her Era

졸업작품 내러티브 대화형 게임 (React + TypeScript + Vite)

## 실행
```bash
npm install
npm run dev
```

## 화면 흐름
타이틀(인트로 모션) → 이름·나이 입력 → 성별 선택 → 게임 규칙(how to play) → 부팅 로딩(CRT 전환) → background 1·2·3 (타이핑 연출) → 메인 대시보드 → 시간대 진입 설정 → 세팅 준비 → 접속중 화면 1·2·3

| 화면 | 파일 | Figma node |
|---|---|---|
| 타이틀 | `src/screens/OpeningTitle.tsx` | 597:16180 |
| 이름·나이 | `src/screens/EnterName.tsx` | 597:18466, 597:19004 |
| 성별 선택 | `src/screens/ChooseGender.tsx` | 597:19547, 597:20095 |
| 게임 규칙 | `src/screens/HowToPlay.tsx` | 597:20633 |
| 부팅 로딩 | `src/screens/BootLoader.tsx` | (Figma 없음) |
| background 1·2·3 | `src/screens/connect/ConnectScreens.tsx` | 697:13092, 697:13642, 697:14191 |
| 메인 대시보드 | `src/screens/dashboard/MainDashboard.tsx` | 697:9727 |
| 시간대 진입 설정 | `src/screens/dashboard/TimeSetup.tsx` | 697:11800 |
| 세팅 준비(게이지) | `src/screens/dashboard/TimeReady.tsx` | 697:10164 |
| 접속중 화면 1·2·3 | `src/screens/signal/SignalScreens.tsx` | 697:11025, 697:10629, 697:11408 |

## 개발용 바로가기
주소 뒤에 `?screen=화면이름`을 붙이면 그 화면부터 시작해요.
예) `http://localhost:5173/?screen=dashboard`, `?screen=timeSetup`, `?screen=bg1`

## 구조
- `src/App.tsx` — 현재 화면 상태와 플레이어 정보(이름·나이·성별, localStorage 저장)
- `src/components/Stage.tsx` — Figma 아트보드(1920×1080)를 모니터 크기에 맞게 확대/축소(비율 유지). 16:9가 아닌 모니터(울트라와이드·16:10·세로형)에서는 그리드/배경이 화면 끝까지 이어짐
- `src/components/GridBackground.tsx` — 점선 그리드(SVG 패턴, 아트보드 밖까지 연장)
- `src/components/ScreenTransition.tsx` — 화면 사이 세로 카메라 이동 전환
- `src/components/TypeWriter.tsx` — 터미널식 타이핑 효과 (클릭 시 즉시 완성)
- `src/components/GridBackground.tsx` — 모든 화면 공통 격자 배경
- `src/game/eras.ts` — 입력한 연도 → 가장 가까운 시대 매칭 (과거 1935 / 현재 2026 / 미래 2150)
- `src/assets/` — Figma에서 내보낸 SVG

## 폰트
- Victor Mono: Google Fonts에서 불러옴
- DSEG14 Classic(디지털 숫자): npm `dseg` 패키지
- Platelet(버튼·입력칸): 웹폰트 미포함. 기기에 설치돼 있으면 사용하고, 없으면 Victor Mono Light로 표시
