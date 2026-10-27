import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { ReactNode } from 'react';

import { loadHistory, type HistoryKey, type HistoryLine } from '../../game/chatHistory';
import { ChapterChrome } from './ChapterParts';
import './chapter-nav.css';

/**
 * 챕터 채팅 — 위쪽 네비게이션 (Figma 1462:3252 · 1462:3362 · 1462:3560)
 *
 *   ChapterTop       1462:3362  화면 맨 위에 마우스를 올리면 내려오는 바
 *                               NOW · PAST | 1920 · GO TO MAIN · CHAT HISTORY · STOP
 *                               바가 내려와 있는 동안 연도 배너 · 제목 · 멈춤 · 나가기는 감춘다 (같은 자리라 겹친다)
 *   ChatHistoryView  1462:3560  지금까지 나눈 대화 다시 보기 — 왼쪽엔 그녀(눈 깜빡임), 오른쪽엔 기록 판
 *
 *   NOW        지금은 과거에 접속 중이라 표시만 한다
 *   GO TO MAIN 메인(대시보드)으로
 *   STOP       채팅 중단 확인 (나가기와 같다)
 */

/** 처음 들어왔을 때 바를 한 번 보여 주고 들어가기까지 */
const PEEK_MS = 2600;

export function ChapterTop({
  year,
  title,
  paused,
  history,
  pinned = false,
  onPause,
  onExit,
  onMain,
  onHistory,
  era,
  chrome,
}: {
  year: string;
  title: string;
  /** 시대 알약 문구 — 기본은 "PAST | {year}" (하리는 "PRESENT | 2026") */
  era?: string;
  /** 바가 올라가 있을 때 보이는 위쪽 장식 — 기본은 나혜석 챕터의 연도 배너 · 제목 · 멈춤 · 나가기 */
  chrome?: ReactNode;
  paused: boolean;
  history: boolean;
  /** 모달이 떠 있는 동안처럼 바를 내려 둬야 할 때 */
  pinned?: boolean;
  onPause: () => void;
  onExit: () => void;
  onMain: () => void;
  onHistory: (open: boolean) => void;
}) {
  const [hover, setHover] = useState(false);
  const [peek, setPeek] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setPeek(false), PEEK_MS);
    return () => window.clearTimeout(t);
  }, []);

  // 채팅 기록을 보는 동안은 늘 내려와 있다
  const shown = history || pinned || hover || peek;

  return (
    <>
      <div className={`chn-chrome${shown ? ' is-hidden' : ''}`} aria-hidden={shown}>
        {chrome ?? <ChapterChrome year={year} title={title} paused={paused} onPause={onPause} onExit={onExit} />}
      </div>

      <div className={`chn-shade${shown ? ' is-shown' : ''}`} aria-hidden />

      {/* 맨 위 가장자리 — 마우스가 닿으면 바가 내려온다 */}
      <div className="chn-edge" onMouseEnter={() => setHover(true)} aria-hidden />

      <nav
        className={`chn${shown ? ' is-shown' : ''}${pinned ? ' is-pinned' : ''}`}
        aria-label="챕터 메뉴"
        data-node-id="1462:4099"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false);
        }}
      >
        <div className="chn-bar" aria-hidden />

        <div className="chn-group chn-group--left">
          <span className="chn-pill chn-pill--now">NOW</span>
          <span className="chn-pill chn-pill--past is-on" aria-current="true">
            <i className="chn-dot chn-dot--green" aria-hidden />
            {era ?? `PAST | ${year}`}
          </span>
        </div>

        <button type="button" className="chn-pill chn-pill--main" onClick={onMain}>
          GO TO MAIN
        </button>

        <div className="chn-group chn-group--right">
          <button
            type="button"
            className={`chn-pill chn-pill--history${history ? ' is-on' : ''}`}
            onClick={() => onHistory(!history)}
            aria-pressed={history}
          >
            {history && <i className="chn-dot chn-dot--orange" aria-hidden />}
            CHAT HISTORY
          </button>
          <button type="button" className="chn-pill chn-pill--stop" onClick={onExit}>
            STOP
          </button>
        </div>
      </nav>
    </>
  );
}

/* ---------------------------------------------------------------------------
 * 1462:3560 — 채팅 기록
 * ------------------------------------------------------------------------- */

type Group = { from: 'her' | 'you'; lines: string[] };

function groupLines(lines: HistoryLine[]): Group[] {
  const out: Group[] = [];
  for (const l of lines) {
    const last = out[out.length - 1];
    if (last && last.from === l.from) last.lines.push(l.text);
    else out.push({ from: l.from, lines: [l.text] });
  }
  return out;
}

const TRACK_PAD = 26;
const THUMB_MIN = 60;

export function ChatHistoryView({
  chapter,
  title,
  year,
  backdrop,
  figure,
  avatar,
  className,
  onBack,
}: {
  chapter: HistoryKey;
  title: string;
  year: string;
  backdrop: ReactNode;
  figure: string;
  avatar: string;
  /** 인물마다 다른 배치 · 아바타 색 (예: 하리 'chh--hari') */
  className?: string;
  onBack: () => void;
}) {
  // 열 때 한 번 읽는다 — 채팅 화면이 로그가 바뀔 때마다 이번 접속분을 저장해 두었다
  const [groups] = useState(() => groupLines(loadHistory(chapter).flatMap((s) => s.lines)));

  const box = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ top: 0, size: 1 });
  const drag = useRef<{ y: number; scroll: number } | null>(null);

  const measure = () => {
    const el = box.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setThumb({ top: max > 0 ? el.scrollTop / max : 0, size: Math.min(1, el.clientHeight / Math.max(1, el.scrollHeight)) });
  };

  // 가장 최근 대화가 보이게 맨 아래에서 시작
  useLayoutEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
    measure();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onBack();
      }
    };
    const onMove = (e: PointerEvent) => {
      const el = box.current;
      if (!drag.current || !el) return;
      const track = el.clientHeight - TRACK_PAD * 2;
      const thumbPx = Math.max(THUMB_MIN, track * (el.clientHeight / el.scrollHeight));
      const scale = (el.scrollHeight - el.clientHeight) / Math.max(1, track - thumbPx);
      const zoom = el.getBoundingClientRect().height / el.clientHeight || 1;
      el.scrollTop = drag.current.scroll + ((e.clientY - drag.current.y) / zoom) * scale;
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [onBack]);

  const trackH = 731 - TRACK_PAD * 2;
  const thumbH = Math.max(THUMB_MIN, trackH * thumb.size);

  return (
    <div className={`chh${className ? ` ${className}` : ''}`} data-node-id="1462:3560">
      {/* 1462:3363 — 기록을 볼 때 장면은 흐리게 (layer blur 8) */}
      <div className="chh-backdrop" aria-hidden>
        {backdrop}
      </div>
      <div className="ch1-vignette" aria-hidden />

      {/* 1920-1927_혜석 — 눈 깜빡이는 그녀 */}
      <div className="chh-figure" aria-hidden>
        <img src={figure} alt="" />
      </div>

      <section className="chh-panel" aria-label="채팅 기록">
        <header className="chh-head">
          <span className="chh-head__title">/{title}/</span>
          <span className="chh-head__year">{year}</span>
        </header>

        <div ref={box} className="chh-log" onScroll={measure} tabIndex={0} role="log" aria-label="지난 대화">
          {groups.length === 0 && <p className="chh-empty">아직 나눈 대화가 없어요.</p>}
          {groups.map((g, i) =>
            g.from === 'her' ? (
              <div key={i} className="chh-her">
                <span className="chh-avatar" aria-hidden>
                  <img src={avatar} alt="" />
                </span>
                <div className="chh-bubbles">
                  {g.lines.map((t, j) => (
                    <p key={j} className="chh-bubble">
                      {t}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div key={i} className="chh-you">
                {g.lines.map((t, j) => (
                  <p key={j} className="chh-bubble chh-bubble--you">
                    {t}
                  </p>
                ))}
              </div>
            ),
          )}
        </div>

        {thumb.size < 1 && (
          <span
            className="chh-thumb"
            style={{ top: TRACK_PAD + thumb.top * (trackH - thumbH), height: thumbH }}
            onPointerDown={(e) => {
              e.preventDefault();
              drag.current = { y: e.clientY, scroll: box.current?.scrollTop ?? 0 };
            }}
            aria-hidden
          />
        )}
      </section>

      <button type="button" className="chh-back" onClick={onBack}>
        BACK
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 1462:3273 — 메인으로 나가기 확인
 * ------------------------------------------------------------------------- */

export function FinishModal({ onHome, onContinue }: { onHome: () => void; onContinue: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onContinue();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onContinue]);

  return (
    <div className="chf" role="dialog" aria-modal="true" aria-labelledby="chf-title" data-node-id="1462:3273">
      {/* 1462:3287 — 화면 전체를 어둡게 + 흐리게 */}
      <div className="chf-wash" onClick={onContinue} aria-hidden />
      <div className="chf-box" data-node-id="1468:12897">
        <p id="chf-title" className="chf-title">
          Do you want to
          <br />
          finish this game?
        </p>
        <div className="chf-actions">
          <button type="button" className="chf-btn" onClick={onHome}>
            GO TO HOME
          </button>
          <button type="button" className="chf-btn" onClick={onContinue} autoFocus>
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}
