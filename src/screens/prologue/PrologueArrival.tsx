import { useCallback, useEffect, useRef, useState } from 'react';

import { BgPlate, ChapterBadge } from './PrologueParts';
import {
  ARRIVAL_HEADER,
  ARRIVAL_LINES,
  ENTER_BUTTON_LABEL,
  TITLE_CARD,
} from './prologueScript';

/**
 * Figma 856:94 (0. 1번) + 856:797 (0. 2번)
 *
 * 두 노드는 배경·배지·내레이션 바가 동일하고 하단 대사만 다르다.
 * 그래서 화면을 나누지 않고 한 컴포넌트가 대사 인덱스를 들고 진행한다.
 * 마지막 줄(showEnterButton)에 도달하면 856:797 상태가 된다.
 */

/** 한 글자 찍는 간격 (ms) */
const TYPE_SPEED = 42;

type Props = {
  onEnter: () => void;
};

export default function PrologueArrival({ onEnter }: Props) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const timer = useRef<number | null>(null);

  const line = ARRIVAL_LINES[index];
  const prevLine = index > 0 ? ARRIVAL_LINES[index - 1] : null;
  const isTyping = typed.length < line.text.length;
  const atEnd = Boolean(line.showEnterButton) && !isTyping;

  // 타이핑
  useEffect(() => {
    setTyped('');
    let i = 0;
    const tick = () => {
      i += 1;
      setTyped(line.text.slice(0, i));
      if (i < line.text.length) {
        timer.current = window.setTimeout(tick, TYPE_SPEED);
      }
    };
    timer.current = window.setTimeout(tick, TYPE_SPEED);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [line]);

  /** 타이핑 중이면 즉시 완성, 아니면 다음 줄 */
  const advance = useCallback(() => {
    if (isTyping) {
      if (timer.current) window.clearTimeout(timer.current);
      setTyped(line.text);
      return;
    }
    if (line.showEnterButton) return; // 마지막 줄은 버튼으로만 진행
    setIndex((n) => Math.min(n + 1, ARRIVAL_LINES.length - 1));
  }, [isTyping, line]);

  // 스페이스 / 엔터로도 진행
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (atEnd) onEnter();
      else advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, atEnd, onEnter]);

  const nodeId = line.showEnterButton ? '856:797' : '856:94';

  return (
    <div className="pr-screen pr-arrival" data-node-id={nodeId}>
      <BgPlate
        className="pr-arrival__plate"
        left={81}
        top={0}
        width={1762}
        height={1277}
      />
      <div className="pr-grade-hue" data-node-id="856:96" />
      <div
        className="pr-grade-exclusion pr-arrival__grade-exclusion"
        data-node-id="856:97"
      />
      <div className="pr-vignette pr-arrival__vignette" data-node-id="856:98" />

      {/* 클릭 진행 레이어 — 배경 위, UI 아래 */}
      <button
        type="button"
        className="pr-advance-layer"
        onClick={advance}
        aria-label="다음 대사"
      />

      {/* 856:99 — 챕터 배지 */}
      <ChapterBadge
        className="pr-arrival__badge"
        label={TITLE_CARD.chapter}
        width={390}
      />

      {/* 856:108 / 856:112 — 상단 내레이션 바 */}
      <div className="pr-arrival__header" data-node-id="856:108" />
      <p className="pr-arrival__header-text" data-node-id="856:112">
        {ARRIVAL_HEADER}
      </p>

      {/* 856:109 — 하단 2줄 대사창 */}
      <div className="pr-arrival__log" data-node-id="856:109">
        <p className="pr-arrival__log-prev" data-node-id="856:110">
          {prevLine ? prevLine.text : '\u200b'}
        </p>
        <p
          key={line.id}
          className="pr-arrival__log-curr pr-arrival__log-curr--enter"
          data-node-id="856:111"
        >
          {typed}
          {isTyping && <span className="pr-caret">▌</span>}
        </p>
      </div>

      {/* 856:813 — 들어간다 */}
      {atEnd ? (
        <button type="button" className="pr-enter-btn" onClick={onEnter}>
          {ENTER_BUTTON_LABEL}
        </button>
      ) : (
        !isTyping && <p className="pr-arrival__hint">CLICK TO CONTINUE</p>
      )}
    </div>
  );
}
