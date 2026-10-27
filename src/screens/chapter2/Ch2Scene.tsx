import { ART } from '../chapter/art';
import her1920Blink from '../../assets/chapter2/her-1920-blink.webp';
import her1920Gesture from '../../assets/chapter2/her-1920-gesture.webp';
import her1920Cross from '../../assets/chapter2/her-1920-crossarms.webp';
import her1920CrossTilt from '../../assets/chapter2/her-1920-crossarms-tilt.webp';

/**
 * 챕터 2 배경 · 인물
 *   930:5330  image 39             이젤 · 의자 스케치 (1954.366×1409, cover). blur 없음
 *   930:5332  exclusion 보정
 *   942:8493  1920-1927_혜석 1     스물네 살 그녀 (단독 PNG, 배율 0.2557)
 */

export type Ch2Room = 'sketch' | 'studio';

/**
 * room
 *   sketch  1462:3261  image 39 — 이젤 · 의자 스케치 (처음 들어선 곳)
 *   studio  1497:14587 image 38 — 화실 안쪽 (공간이동 뒤, blur 6.9)
 */
export function Ch2Backdrop({ room = 'sketch' }: { room?: Ch2Room }) {
  if (room === 'studio') {
    return (
      <>
        <div className="ch2-studio" aria-hidden data-node-id="1497:14587">
          <img src={ART.ch2Studio} alt="" />
        </div>
        <div className="pr-grade-exclusion ch2-grade ch2-grade--studio" aria-hidden data-node-id="1497:14588" />
      </>
    );
  }
  return (
    <>
      <div className="ch2-room" aria-hidden data-node-id="930:5330">
        <img src={ART.ch2Room} alt="" />
      </div>
      <div className="pr-grade-exclusion ch2-grade" aria-hidden data-node-id="930:5332" />
    </>
  );
}

/**
 * 채팅 중 그녀의 몸짓 (1462:3259 · 3322 · 1502:14649 · 1555:20494)
 *   blink   기본 — 유저가 말을 고르는 동안
 *   think   팔짱 — 대답을 생각하는 동안 (두 가지를 번갈아)
 *   gesture 손짓 — 그녀가 말할 때 · 질문을 던질 때
 * 세 그림을 미리 다 깔아 두고 보이는 것만 바꾼다 (src 를 바꾸면 다시 받느라 깜빡인다).
 * 모두 같은 원본에서 같은 배율로 잘라, 몸 위치가 그대로 이어진다.
 */
export type Ch2Pose = 'blink' | 'think' | 'gesture';

export function Ch2Motion({ pose, tilt = false, entering = false }: { pose: Ch2Pose; tilt?: boolean; entering?: boolean }) {
  const frames: [string, string, boolean][] = [
    ['blink', her1920Blink, pose === 'blink'],
    ['think', her1920Cross, pose === 'think' && !tilt],
    ['think-tilt', her1920CrossTilt, pose === 'think' && tilt],
    ['gesture', her1920Gesture, pose === 'gesture'],
  ];
  return (
    <div className={`ch2-motion${entering ? ' ch1-figure--enter' : ''}`} aria-hidden data-node-id="1502:14641">
      {frames.map(([k, src, on]) => (
        <img key={k} className={`ch2-motion__${k.startsWith('think') ? 'think' : k}${on ? ' is-on' : ''}`} src={src} alt="" />
      ))}
    </div>
  );
}

export function Ch2Figure({ entering = false }: { entering?: boolean }) {
  const anim = ART.ch2HerIdle;
  return (
    <div
      className={`ch2-figure${anim ? ' ch2-figure--anim' : ''}${entering ? ' ch1-figure--enter' : ''}`}
      aria-hidden
      data-node-id="942:8493"
    >
      <img src={anim ?? ART.ch2Her} alt="" />
    </div>
  );
}
