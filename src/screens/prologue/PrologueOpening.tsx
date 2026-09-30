import { useEffect, useState } from 'react';

import { AdvanceLayer } from './PrologueParts';
import { OPENING_TUNING_LINES } from './prologueScript';

/**
 * Figma 856:68 — 0. 프롤로그 오프닝
 *
 * 부팅 직후 수신 로그가 한 줄씩 찍힌다. 전부 찍히고 나면 잠깐 머물렀다가
 * 자동으로 다음(인용구)으로 넘어간다. 화면을 누르면 즉시 스킵.
 */

/** 줄 사이 간격 (ms). 빈 줄은 절반만 기다린다. */
const LINE_DELAY = 420;
/** 마지막 줄이 찍힌 뒤 머무는 시간 (ms) */
const HOLD_AFTER = 1800;

type Props = {
  onDone: () => void;
};

export default function PrologueOpening({ onDone }: Props) {
  const [visible, setVisible] = useState(0);

  // 한 줄씩 노출
  useEffect(() => {
    if (visible >= OPENING_TUNING_LINES.length) return;
    const isBlank = OPENING_TUNING_LINES[visible].trim() === '';
    const t = window.setTimeout(
      () => setVisible((n) => n + 1),
      isBlank ? LINE_DELAY / 2 : LINE_DELAY,
    );
    return () => window.clearTimeout(t);
  }, [visible]);

  // 전부 찍힌 뒤 자동 진행
  useEffect(() => {
    if (visible < OPENING_TUNING_LINES.length) return;
    const t = window.setTimeout(onDone, HOLD_AFTER);
    return () => window.clearTimeout(t);
  }, [visible, onDone]);

  const done = visible >= OPENING_TUNING_LINES.length;

  return (
    <div className="pr-screen pr-opening" data-node-id="856:68">
      <div className="pr-vignette pr-opening__vignette" />

      <div
        className={`pr-opening__log${done ? ' pr-opening__log--live' : ''}`}
        data-node-id="856:70"
      >
        {OPENING_TUNING_LINES.map((line, i) => (
          <p
            key={i}
            className="pr-opening__log-line"
            style={{
              animationDelay: '0ms',
              visibility: i < visible ? 'visible' : 'hidden',
            }}
          >
            {line === '' ? '\u200b' : line}
          </p>
        ))}
      </div>

      <AdvanceLayer onAdvance={onDone} label="오프닝 건너뛰기" />
    </div>
  );
}
