import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { ReactNode } from 'react';

import { AdvanceLayer, BgPlate, ChapterBadge, NoticeFrame } from '../prologue/PrologueParts';
import './chapter.css';

/**
 * 챕터 채팅 화면이 함께 쓰는 부품
 *   ChatLog    929:5322 ~ 5326 / 930:5363 — 그녀 말풍선(왼쪽) · 유저 답(오른쪽)
 *   ExitModal  856:537 / 935:5598         — 채팅을 중단할까요?
 *   TuningScreen    934:5495 / 935:5569  — 튜닝 로그 (프롤로그 856:68 과 같은 배치)
 *   TitleCardScreen 934:5498 / 935:5572  — 타이틀 카드 (프롤로그 856:76 과 같은 부품) — 지금은 안 쓴다
 *
 *   (2차 디자인, Figma 1200:*)
 *   ChapterChrome        1200:13167 ~   — 연도 배너 · 챕터 제목 바 · 멈춤 · 나가기
 *   ChapterEntryScreen   1200:13381 / 13469 — 진입: 큰 연도 배너 + 챕터 제목 바
 *   PauseOverlay         멈춤 버튼을 눌렀을 때
 */

export type ChatMsg = { id: string; from: 'her' | 'you'; text: string; live?: boolean };

/**
 * 채팅 로그 — 휠 · 트랙패드로 위로 올려 지난 대화를 볼 수 있다.
 *
 * 맨 아래에 붙어 있을 때만 새 말풍선을 따라 내려가고,
 * 위로 올려 읽는 중에는 제자리를 지킨 채 "최근 대화로" 버튼을 띄운다.
 * (flex-end 로 쌓으면 넘친 위쪽을 스크롤할 수 없어, 안쪽 목록을 margin-top:auto 로 내린다)
 */
export function ChatLog({ log, thinking }: { log: ChatMsg[]; thinking: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const [away, setAway] = useState(false);

  const toBottom = useCallback((smooth: boolean) => {
    const el = box.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    stuck.current = true;
    setAway(false);
  }, []);

  // 처음 열릴 때 · 새 말이 붙을 때 — 바닥에 붙어 있었으면 따라 내려간다
  useLayoutEffect(() => {
    if (stuck.current) toBottom(false);
  }, [log.length, thinking, toBottom]);

  const onScroll = () => {
    const el = box.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    stuck.current = atBottom;
    setAway(!atBottom);
  };

  return (
    <>
      <div
        ref={box}
        className="pr-chatlog ch1-chatlog"
        onScroll={onScroll}
        tabIndex={0}
        aria-label="지난 대화"
        role="log"
      >
        <div className="ch1-chatlog__list">
          {log.map((m) =>
            m.from === 'her' ? (
              <div key={m.id} className="pr-chatlog__row pr-chatlog__row--her">
                <span className="pr-bubble ch1-bubble">{m.text}</span>
              </div>
            ) : (
              <div key={m.id} className="pr-chatlog__row pr-chatlog__row--you">
                <p className="pr-reply ch1-reply">{m.text}</p>
              </div>
            ),
          )}
          {thinking && (
            <div className="pr-chatlog__row pr-chatlog__row--her">
              <span className="pr-bubble pr-bubble--thinking">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>
      </div>
      {away && (
        <button type="button" className="ch1-chatlog__jump" onClick={() => toBottom(true)}>
          최근 대화로 ↓
        </button>
      )}
    </>
  );
}

const EXIT_TEXT = {
  question: '채팅을 중단할까요?',
  stay: '이어서 진행',
  leave: '여기까지',
} as const;

export function ExitModal({ badge, onStay, onLeave }: { badge: string; onStay: () => void; onLeave: () => void }) {
  return (
    <div className="ch1-exit" role="dialog" aria-modal="true" aria-label={EXIT_TEXT.question}>
      <div className="pr-ending__wash" />
      <ChapterBadge className="pr-ending__badge pr-ending__reveal" label={badge} width={704.992} />
      <NoticeFrame className="pr-ending__frame pr-ending__reveal" style={{ animationDelay: '120ms' }} />
      <p className="pr-ending__line ch1-exit__line pr-ending__reveal" style={{ animationDelay: '240ms' }}>
        {EXIT_TEXT.question}
      </p>
      <button
        type="button"
        className="pr-btn pr-ending__btn pr-ending__btn--primary pr-ending__reveal"
        style={{ animationDelay: '320ms' }}
        onClick={onStay}
        autoFocus
      >
        {EXIT_TEXT.stay}
      </button>
      <button
        type="button"
        className="pr-btn pr-ending__btn pr-ending__btn--secondary pr-ending__reveal"
        style={{ animationDelay: '380ms' }}
        onClick={onLeave}
      >
        {EXIT_TEXT.leave}
      </button>
    </div>
  );
}


/* -------------------------------------------------------------------------
 * 튜닝 로그 — 한 줄씩 찍히고, 다 찍히면 잠깐 머물렀다 넘어간다
 * ----------------------------------------------------------------------- */

const LINE_DELAY = 420;
const HOLD_AFTER = 1800;

export function TuningScreen({ lines, nodeId, onDone }: { lines: readonly string[]; nodeId: string; onDone: () => void }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= lines.length) {
      const t = window.setTimeout(onDone, HOLD_AFTER);
      return () => window.clearTimeout(t);
    }
    const blank = lines[visible].trim() === '';
    const t = window.setTimeout(() => setVisible((n) => n + 1), blank ? LINE_DELAY / 2 : LINE_DELAY);
    return () => window.clearTimeout(t);
  }, [visible, lines, onDone]);

  const done = visible >= lines.length;

  return (
    <div className="pr-screen pr-opening" data-node-id={nodeId}>
      <div className="pr-vignette pr-opening__vignette" />
      <div className={`pr-opening__log${done ? ' pr-opening__log--live' : ''}`}>
        {lines.map((line, i) => (
          <p key={i} className="pr-opening__log-line" style={{ visibility: i < visible ? 'visible' : 'hidden' }}>
            {line === '' ? '\u200b' : line}
          </p>
        ))}
      </div>
      <AdvanceLayer onAdvance={onDone} label="접속 건너뛰기" />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * 타이틀 카드 — 배경판 · 보정 · 배너 · 액자는 프롤로그와 좌표가 같다
 * ----------------------------------------------------------------------- */

const TITLE_HOLD = 5600;

export function TitleCardScreen({
  badge,
  intro,
  nodeId,
  introClassName,
  onDone,
}: {
  badge: string;
  intro: readonly string[];
  nodeId: string;
  introClassName?: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onDone, TITLE_HOLD);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pr-screen pr-title" data-node-id={nodeId}>
      <BgPlate className="pr-title__plate" left={-4} top={-26} width={1928} height={1397} />
      <div className="pr-grade-exclusion pr-title__grade-exclusion" />
      <div className="pr-grade-sepia" />
      <ChapterBadge
        className="pr-title__reveal"
        label={badge}
        width={704.992}
        left={608}
        top={243}
        style={{ animationDelay: '120ms' }}
      />
      <NoticeFrame className="pr-title__reveal" style={{ animationDelay: '420ms' }} />
      <div
        className={`ch1-title__intro pr-title__reveal${introClassName ? ` ${introClassName}` : ''}`}
        style={{ animationDelay: '760ms' }}
      >
        {intro.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
      <AdvanceLayer onAdvance={onDone} label="건너뛰기" />
    </div>
  );
}


/* -------------------------------------------------------------------------
 * 2차 디자인 (Figma 1200:13167 ~ 13577)
 * ----------------------------------------------------------------------- */

/** 1200:13270 / 13271 / 멈춤 · 나가기 — 챕터 채팅 화면 위쪽 */
export function ChapterChrome({
  year,
  title,
  paused,
  onPause,
  onExit,
}: {
  year: string;
  title: string;
  paused: boolean;
  onPause: () => void;
  onExit: () => void;
}) {
  return (
    <>
      <div className="chc-banner" aria-hidden>
        <span>{year}</span>
      </div>
      <p className="chc-title">{title}</p>
      <button
        type="button"
        className={`chc-tool chc-tool--pause${paused ? ' is-on' : ''}`}
        onClick={onPause}
        aria-label={paused ? '이어서 하기' : '잠시 멈춤'}
        aria-pressed={paused}
      >
        <svg viewBox="0 0 30 36" aria-hidden>
          <path d="M30 17.7534L0 35.5069L0 0L30 17.7534Z" />
        </svg>
      </button>
      <button type="button" className="chc-tool chc-tool--exit" onClick={onExit} aria-label="나가기">
        <svg viewBox="0 0 64 64" aria-hidden>
          <path d="M10.06 10L53.66 53.6M53.94 10L10.34 53.6" />
        </svg>
      </button>
    </>
  );
}

/** 멈춤 — 화면을 덮고, 다시 누르거나 아무 데나 누르면 이어진다 */
export function PauseOverlay({ onResume }: { onResume: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onResume();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onResume]);

  return (
    <div className="chc-pause" role="dialog" aria-modal="true" aria-label="잠시 멈춤" onClick={onResume}>
      <p className="chc-pause__title">잠시 멈춤</p>
      <p className="chc-pause__hint">아무 곳이나 누르면 이어서 대화해요</p>
    </div>
  );
}

const ENTRY_HOLD = 3600;

/** 1200:13381 / 13469 — 진입. 장면 배경을 어둡게 눌러 깔고 연도 · 제목만 */
export function ChapterEntryScreen({
  year,
  title,
  nodeId,
  backdrop,
  onDone,
}: {
  year: string;
  title: string;
  nodeId: string;
  backdrop: ReactNode;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onDone, ENTRY_HOLD);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pr-screen chc-entry" data-node-id={nodeId}>
      {backdrop}
      <div className="chc-entry__multiply" aria-hidden />
      <div className="chc-entry__banner pr-title__reveal" style={{ animationDelay: '120ms' }} aria-hidden>
        <span>{year}</span>
      </div>
      <p className="chc-entry__title pr-title__reveal" style={{ animationDelay: '480ms' }}>
        {title}
      </p>
      <AdvanceLayer onAdvance={onDone} label="건너뛰기" />
    </div>
  );
}
