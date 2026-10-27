/**
 * 챕터 인물 · 배경 그림 — 채팅 화면과 캐릭터 화면 초상이 함께 쓴다
 *
 * 챕터 1 그림은 선택 사항이라(없으면 프롤로그 그림으로 대체) glob 으로 찾는다.
 */
import her1920 from '../../assets/chapter2/her-1920.png';
// 임시: 움직이는 그녀 (480×480 GIF, 21프레임). 큰 WebP/APNG 를 받으면 이 줄만 바꾼다
import her1920Idle from '../../assets/chapter2/her-1920-idle.gif';
import studioSketch from '../../assets/chapter2/studio-sketch.webp';

const ch1Files = import.meta.glob('../../assets/chapter1/*.{png,webp,jpg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function pick(file: string): string | undefined {
  return Object.entries(ch1Files).find(([path]) => path.endsWith(`/${file}`))?.[1];
}

// 1497:14587 image 38 — 공간이동 뒤 화실. 파일(studio-room.*)을 넣으면 그걸 쓰고, 없으면 첫 방 그림으로 대신한다
const ch2Files = import.meta.glob('../../assets/chapter2/studio-room.{png,webp,jpg,jpeg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;
const studioRoom = Object.values(ch2Files)[0] as string | undefined;

export const ART = {
  ch1Room: pick('room-sketch.webp') ?? pick('room-sketch.png'),
  ch1Her: pick('her-1914.png') ?? pick('her-1914.webp'),
  ch2Room: studioSketch,
  ch2Studio: studioRoom ?? studioSketch,
  ch2Her: her1920,
  /** 채팅 화면에서만 쓰는 움직이는 그림. 캐릭터 화면 초상은 ch2Her(정지) 그대로 */
  ch2HerIdle: her1920Idle as string | undefined,
} as const;
