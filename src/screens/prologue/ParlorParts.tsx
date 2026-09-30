import { useEffect, useRef, useState } from 'react';

import parlorInterior from '../../assets/prologue/parlor-interior.webp';
import herPortrait from '../../assets/prologue/her-portrait.png';
import { ChapterBadge } from './PrologueParts';
import { PARLOR_HEADER } from './chapter0Script';

/* -------------------------------------------------------------------------
 * ParlorBackdrop — 856:179 ~ 181 (배경 + saturation 레이어 + 비네트)
 * ----------------------------------------------------------------------- */

export function ParlorBackdrop({ deep = false }: { deep?: boolean }) {
  return (
    <>
      <div className="pr-parlor__bg" aria-hidden>
        <img src={parlorInterior} alt="" />
      </div>
      <div className="pr-parlor__desaturate" aria-hidden />
      <div
        className={`pr-parlor__vignette${deep ? ' pr-parlor__vignette--deep' : ''}`}
        aria-hidden
      />
    </>
  );
}

/* -------------------------------------------------------------------------
 * ParlorChrome — 856:182 ~ 194 (챕터 배지 + 내레이션 바 + 우측 버튼 2개)
 * ----------------------------------------------------------------------- */

type ChromeProps = {
  header?: string;
  onTool1?: () => void;
  onTool2?: () => void;
};

export function ParlorChrome({
  header = PARLOR_HEADER,
  onTool1,
  onTool2,
}: ChromeProps) {
  return (
    <>
      <ChapterBadge
        className="pr-arrival__badge"
        label="Chaptor 0. Prologue."
        width={390}
      />
      <div className="pr-parlor__header" />
      <p className="pr-parlor__header-text">{header}</p>
      <button
        type="button"
        className="pr-parlor__tool pr-parlor__tool--1"
        onClick={onTool1}
        aria-label="기록"
      />
      <button
        type="button"
        className="pr-parlor__tool pr-parlor__tool--2"
        onClick={onTool2}
        aria-label="설정"
      />
    </>
  );
}

/* -------------------------------------------------------------------------
 * HerFigure — 856:592 (실루엣) / 856:235 (정면)
 *
 * 실루엣 전용 에셋이 따로 없어 같은 인물 PNG 를 CSS 로 어둡게 깔고
 * blur 를 건다. 전용 아트가 생기면 herSilhouette 를 import 해서
 * 아래 src 만 갈아끼우면 된다.
 * ----------------------------------------------------------------------- */

export function HerFigure({
  variant,
  entering = false,
}: {
  variant: 'silhouette' | 'portrait';
  entering?: boolean;
}) {
  const silhouette = variant === 'silhouette';
  return (
    <div
      className={
        'pr-figure' +
        (silhouette ? ' pr-figure--silhouette' : '') +
        (entering ? ' pr-figure--enter' : '')
      }
      aria-hidden
    >
      <img src={herPortrait} alt="" />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * useTypewriter — 한 글자씩 찍기. 클릭하면 즉시 완성.
 * ----------------------------------------------------------------------- */

export function useTypewriter(text: string, speed = 42) {
  const [typed, setTyped] = useState('');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setTyped('');
    let i = 0;
    const tick = () => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i < text.length) timer.current = window.setTimeout(tick, speed);
    };
    timer.current = window.setTimeout(tick, speed);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [text, speed]);

  const done = typed.length >= text.length;
  const finish = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setTyped(text);
  };

  return { typed, done, finish };
}
