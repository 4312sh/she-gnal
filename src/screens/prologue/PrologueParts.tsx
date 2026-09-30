import type { CSSProperties } from 'react';

import atelierExterior from '../../assets/prologue/atelier-exterior.png';
import chapterBanner from '../../assets/prologue/chapter-banner.svg';
import noticeFrame from '../../assets/prologue/notice-frame.svg';

/* -------------------------------------------------------------------------
 * BgPlate — 아뜰리에 외경 스케치 배경판
 *
 * Figma 856:72 / 856:77 / 856:95 / 856:798 은 세로 원본을 -90° 회전해 쓰지만,
 * 내보낸 PNG 가 이미 가로(3000×2187)라 코드에서는 회전하지 않는다.
 * opacity 0.7 도 PNG 에 구워져 있어 CSS 로 다시 걸지 않는다.
 * ----------------------------------------------------------------------- */

type BgPlateProps = {
  left: number;
  top: number;
  width: number;
  height: number;
  className?: string;
};

export function BgPlate({ left, top, width, height, className }: BgPlateProps) {
  return (
    <div
      className={`pr-bg-plate${className ? ` ${className}` : ''}`}
      style={{ left, top, width, height }}
      aria-hidden
    >
      <img className="pr-bg-plate__img" src={atelierExterior} alt="" />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * ChapterBadge — 장식 배너 + 챕터 라벨
 *
 * Figma 856:83 (704.992px) / 856:99 · 856:802 (390px).
 * SVG 원본은 707×309 로 프레임보다 약간 넘치는데, Figma 의 오프셋
 * (top -0.59% / width +0.285% / height +0.955%) 을 그대로 재현한다.
 * ----------------------------------------------------------------------- */

type ChapterBadgeProps = {
  label: string;
  /** Figma 기준 배너 폭 (px) */
  width: number;
  left?: number;
  top?: number;
  className?: string;
  style?: CSSProperties;
};

export function ChapterBadge({
  label,
  width,
  left,
  top,
  className,
  style,
}: ChapterBadgeProps) {
  return (
    <div
      className={`pr-badge${className ? ` ${className}` : ''}`}
      style={{ ['--pr-badge-w' as string]: `${width}px`, left, top, ...style }}
    >
      <img className="pr-badge__art" src={chapterBanner} alt="" />
      <p className="pr-badge__label">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * NoticeFrame — 타이틀 카드의 손그림 액자 (Figma 856:80)
 *
 * SVG 원본 520×310. 내부 어두운 판이 SVG 좌표 (37.65, 28) 에서 시작하고
 * Figma 에서는 절대좌표 (739, 558) 이라 좌상단을 (701.35, 530) 에 놓는다.
 * ----------------------------------------------------------------------- */

type NoticeFrameProps = {
  className?: string;
  style?: CSSProperties;
};

export function NoticeFrame({ className, style }: NoticeFrameProps) {
  return (
    <img
      className={`pr-notice-frame${className ? ` ${className}` : ''}`}
      src={noticeFrame}
      alt=""
      style={style}
    />
  );
}

/* -------------------------------------------------------------------------
 * AdvanceLayer — 화면 아무 곳이나 눌러 다음으로 진행
 * ----------------------------------------------------------------------- */

type AdvanceLayerProps = {
  onAdvance: () => void;
  label?: string;
};

export function AdvanceLayer({
  onAdvance,
  label = '다음으로',
}: AdvanceLayerProps) {
  return (
    <button
      type="button"
      className="pr-advance-layer"
      onClick={onAdvance}
      aria-label={label}
    />
  );
}
