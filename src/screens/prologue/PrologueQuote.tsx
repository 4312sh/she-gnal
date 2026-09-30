import { useEffect } from 'react';

import { AdvanceLayer, BgPlate } from './PrologueParts';
import { OPENING_QUOTE_LINES } from './prologueScript';

/**
 * Figma 856:71 — 0. 프롤로그 오프닝 (인용구)
 *
 * 아뜰리에 외경 위에 나혜석의 말이 한 줄씩 떠오른다.
 * 마지막 줄이 다 뜨고 나면 자동으로 타이틀 카드로 넘어간다.
 */

const LINE_STAGGER = 900;
const HOLD_AFTER = 2600;

type Props = {
  onDone: () => void;
};

export default function PrologueQuote({ onDone }: Props) {
  useEffect(() => {
    const total =
      LINE_STAGGER * (OPENING_QUOTE_LINES.length - 1) + HOLD_AFTER;
    const t = window.setTimeout(onDone, total);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pr-screen pr-quote" data-node-id="856:71">
      <BgPlate
        className="pr-quote__plate"
        left={49}
        top={-32}
        width={1826}
        height={1322}
      />
      <div className="pr-grade-hue" data-node-id="856:73" />
      <div className="pr-vignette pr-quote__vignette" data-node-id="856:74" />

      <div className="pr-quote__text" data-node-id="856:75">
        {OPENING_QUOTE_LINES.map((line, i) => (
          <p
            key={i}
            className="pr-quote__line"
            style={{ animationDelay: `${i * LINE_STAGGER}ms` }}
          >
            {line}
          </p>
        ))}
      </div>

      <AdvanceLayer onAdvance={onDone} label="건너뛰기" />
    </div>
  );
}
