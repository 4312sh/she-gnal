import { useEffect } from 'react';

import { AdvanceLayer, BgPlate, ChapterBadge, NoticeFrame } from './PrologueParts';
import { TITLE_CARD } from './prologueScript';

/**
 * Figma 856:76 — 0. 프롤로그 시작
 *
 * 세피아로 바랜 아뜰리에 위에 챕터 배너와 안내 액자가 뜬다.
 * 배경 톤이 앞뒤 화면과 달라서(세피아 multiply) 전환은 crt 를 권장.
 */

const HOLD = 3400;

type Props = {
  onDone: () => void;
};

export default function PrologueTitleCard({ onDone }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, HOLD);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pr-screen pr-title" data-node-id="856:76">
      <BgPlate
        className="pr-title__plate"
        left={-4}
        top={-26}
        width={1928}
        height={1397}
      />
      <div
        className="pr-grade-exclusion pr-title__grade-exclusion"
        data-node-id="856:78"
      />
      <div className="pr-grade-sepia" data-node-id="856:79" />

      {/* 856:83 */}
      <ChapterBadge
        className="pr-title__reveal"
        label={TITLE_CARD.chapter}
        width={704.992}
        left={608}
        top={243}
        style={{ animationDelay: '120ms' }}
      />

      {/* 856:80 — 손그림 액자 */}
      <NoticeFrame
        className="pr-title__reveal"
        style={{ animationDelay: '420ms' }}
      />

      <p
        className="pr-title__card-text pr-title__card-text--1 pr-title__reveal"
        style={{ animationDelay: '760ms' }}
        data-node-id="856:93"
      >
        {TITLE_CARD.lines[0]}
      </p>
      <p
        className="pr-title__card-text pr-title__card-text--2 pr-title__reveal"
        style={{ animationDelay: '1040ms' }}
        data-node-id="856:92"
      >
        {TITLE_CARD.lines[1]}
      </p>

      <AdvanceLayer onAdvance={onDone} label="건너뛰기" />
    </div>
  );
}
