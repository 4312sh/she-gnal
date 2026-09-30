import parlorInterior from '../../assets/prologue/parlor-interior.webp';
import herPortrait from '../../assets/prologue/her-portrait.png';

/**
 * 챕터 1 전용 그림 두 장
 *
 *   room-sketch.png   929:5256 "image 30"  하숙방 스케치 (회전 · blur · 70% 불투명도가 구워진 채 내보낸 것)
 *   her-1914.png      929:5282 "챕터 1"    열여덟 살 그녀 (레이어 크기 451×1270 그대로 내보낸 것)
 *
 * figma.com 에셋을 작업 환경에서 받을 수 없어서, 파일이 아직 없으면
 * 프롤로그 그림(응접실 · 1935년 그녀)으로 자리를 채운다.
 * `src/assets/chapter1/` 에 위 이름으로 넣기만 하면 코드 수정 없이 바뀐다.
 */

const optional = import.meta.glob('../../assets/chapter1/*.{png,webp,jpg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function pick(file: string): string | undefined {
  const hit = Object.entries(optional).find(([path]) => path.endsWith(`/${file}`));
  return hit?.[1];
}

const roomSketch = pick('room-sketch.png') ?? pick('room-sketch.webp');
const her1914 = pick('her-1914.png') ?? pick('her-1914.webp');

/** 929:5256 + 929:5257 — 배경 스케치 + exclusion 보정 */
export function Ch1Backdrop() {
  return (
    <>
      {roomSketch ? (
        <div className="ch1-room" aria-hidden>
          <img src={roomSketch} alt="" />
        </div>
      ) : (
        <div className="ch1-room ch1-room--fallback" aria-hidden>
          <img src={parlorInterior} alt="" />
        </div>
      )}
      <div className="pr-grade-exclusion ch1-grade" aria-hidden data-node-id="929:5257" />
    </>
  );
}

/** 929:5282 — 그녀 */
export function Ch1Figure({ entering = false }: { entering?: boolean }) {
  return her1914 ? (
    <div className={`ch1-figure${entering ? ' ch1-figure--enter' : ''}`} aria-hidden>
      <img src={her1914} alt="" />
    </div>
  ) : (
    <div className={`pr-figure${entering ? ' pr-figure--enter' : ''}`} aria-hidden>
      <img src={herPortrait} alt="" />
    </div>
  );
}
