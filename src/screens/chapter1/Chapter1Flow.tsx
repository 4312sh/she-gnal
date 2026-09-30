import { useCallback, useEffect, useState } from 'react';

import { AdvanceLayer, BgPlate, ChapterBadge, NoticeFrame } from '../prologue/PrologueParts';
import '../prologue/prologue.css';
import '../prologue/chapter0.css';
import './chapter1.css';
import Chapter1Chat, { type Ch1Start } from './Chapter1Chat';
import { CH1_INTRO, CH1_TITLE_BADGE, CH1_TUNING_LINES } from './chapter1Script';
import type { Chapter1Save } from '../../game/types';

/**
 * Chapter 1 · 도쿄 유학길 — 접속부터 채팅까지
 *
 *   tuning   934:5495   튜닝 로그             자동
 *   title    934:5498   타이틀 카드 + 도입      자동 (클릭하면 넘김)
 *   scene    929:5255 → 929:5290 → 930:5450   하숙방 앞 대화
 *                       나가기는 856:537 모달
 *
 * 튜닝 · 타이틀 카드는 프롤로그와 같은 부품(atelier 배경판, 배너, 액자)을 쓴다.
 */

export type Ch1Step = 'tuning' | 'title' | 'scene';

type Props = {
  playerName: string;
  save?: Chapter1Save;
  onSave: (next: Chapter1Save) => void;
  /** 나가기 (작별 인사가 끝난 뒤) */
  onExit: () => void;
  /** 개발용 진입 지점 */
  startAt?: Ch1Step;
  sceneAt?: Ch1Start;
};

export default function Chapter1Flow({
  playerName,
  save,
  onSave,
  onExit,
  startAt = 'tuning',
  sceneAt,
}: Props) {
  const [step, setStep] = useState<Ch1Step>(startAt);
  const toTitle = useCallback(() => setStep('title'), []);
  const toScene = useCallback(() => setStep('scene'), []);

  switch (step) {
    case 'tuning':
      return <Ch1Tuning onDone={toTitle} />;
    case 'title':
      return <Ch1TitleCard onDone={toScene} />;
    case 'scene':
      return (
        <Chapter1Chat
          playerName={playerName}
          save={save}
          onSave={onSave}
          onExit={onExit}
          startAt={sceneAt}
        />
      );
  }
}

/* -------------------------------------------------------------------------
 * 934:5495 — 튜닝 로그 (프롤로그 856:68 과 같은 배치)
 * ----------------------------------------------------------------------- */

const LINE_DELAY = 420;
const HOLD_AFTER = 1800;

function Ch1Tuning({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= CH1_TUNING_LINES.length) {
      const t = window.setTimeout(onDone, HOLD_AFTER);
      return () => window.clearTimeout(t);
    }
    const blank = CH1_TUNING_LINES[visible].trim() === '';
    const t = window.setTimeout(() => setVisible((n) => n + 1), blank ? LINE_DELAY / 2 : LINE_DELAY);
    return () => window.clearTimeout(t);
  }, [visible, onDone]);

  const done = visible >= CH1_TUNING_LINES.length;

  return (
    <div className="pr-screen pr-opening" data-node-id="934:5495">
      <div className="pr-vignette pr-opening__vignette" data-node-id="934:5496" />
      <div
        className={`pr-opening__log${done ? ' pr-opening__log--live' : ''}`}
        data-node-id="934:5497"
      >
        {CH1_TUNING_LINES.map((line, i) => (
          <p
            key={i}
            className="pr-opening__log-line"
            style={{ visibility: i < visible ? 'visible' : 'hidden' }}
          >
            {line === '' ? '\u200b' : line}
          </p>
        ))}
      </div>
      <AdvanceLayer onAdvance={onDone} label="접속 건너뛰기" />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * 934:5498 — 타이틀 카드
 *
 * 배경판 · 보정 레이어 · 배너 · 액자는 프롤로그 856:76 과 좌표가 같다.
 * 액자 안 문구만 세 줄(18px, 행간 1.5)로 바뀐다.
 * ----------------------------------------------------------------------- */

const TITLE_HOLD = 5600;

function Ch1TitleCard({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, TITLE_HOLD);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pr-screen pr-title" data-node-id="934:5498">
      <BgPlate className="pr-title__plate" left={-4} top={-26} width={1928} height={1397} />
      <div className="pr-grade-exclusion pr-title__grade-exclusion" data-node-id="934:5500" />
      <div className="pr-grade-sepia" data-node-id="934:5501" />

      <ChapterBadge
        className="pr-title__reveal"
        label={CH1_TITLE_BADGE}
        width={704.992}
        left={608}
        top={243}
        style={{ animationDelay: '120ms' }}
      />
      <NoticeFrame className="pr-title__reveal" style={{ animationDelay: '420ms' }} />

      <div className="ch1-title__intro pr-title__reveal" style={{ animationDelay: '760ms' }} data-node-id="934:5514">
        {CH1_INTRO.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>

      <AdvanceLayer onAdvance={onDone} label="건너뛰기" />
    </div>
  );
}
