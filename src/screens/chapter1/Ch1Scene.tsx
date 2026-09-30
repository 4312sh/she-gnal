import parlorInterior from '../../assets/prologue/parlor-interior.webp';
import herPortrait from '../../assets/prologue/her-portrait.png';

/**
 * 챕터 1 전용 그림 두 장
 *
 *   room-sketch.webp  929:5256 "image 30"  하숙방 스케치 (책상 · 의자). blur · 불투명도는 CSS 로 건다
 *   her-1914.png      929:5282 "챕터 1"    열여덟 살 그녀 (1913-1919 단독 그림, 투명 배경)
 *
 * 파일이 없으면 프롤로그 그림(응접실 · 1935년 그녀)으로 자리를 채운다.
 */

const optional = import.meta.glob('../../assets/chapter1/*.{png,webp,jpg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function pick(file: string): string | undefined {
  const hit = Object.entries(optional).find(([path]) => path.endsWith(`/${file}`));
  return hit?.[1];
}

const roomSketch = pick('room-sketch.webp') ?? pick('room-sketch.png');
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

/** 캐릭터 화면 초상에서도 같은 그림을 잘라 쓴다 */
export const her1914Art = her1914;
