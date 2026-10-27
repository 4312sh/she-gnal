import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import parlorSketch from '../../assets/character/past/parlor-sketch.webp';
import herPortrait from '../../assets/prologue/her-portrait.png';
import { TimelineView, type TimelineAt } from './TimelineView';
import { loadHistory, type HistoryChapter, type HistorySession } from '../../game/chatHistory';
import type { Chapter1Save, Chapter2Save } from '../../game/types';
import '../prologue/prologue.css';
import './character.css';
import {
  HISTORY_HEADERS,
  RECORD_SLOTS,
  STORY_ENTRIES,
  STORY_ROWS,
  TABS,
  TUNING_DEFAULT,
  dashboardFor,
  nextChapter,
  type PlayableId,
  type StoryId,
} from './characterData';

/**
 * 과거 · 캐릭터 대시보드 (나혜석)
 *   1136:4249  전체        — 대시보드 + 스토리
 *   1136:4476  스토리 선택  — 대시보드 자리에 Summary (시 + 해시태그 셋)
 *   1136:4398  챗 히스토리  — 대시보드 · 스토리 자리를 넓은 대화 기록 창 하나가 덮는다
 *
 * 좌표는 Figma 1920×1080 아트보드 그대로 (character.css).
 * 테두리 · 칸 · 버튼은 손그림 SVG(src/assets/character/past) 를 깔고 글자만 코드로 얹는다.
 *
 * 채팅 진입
 *   - 초상 카드 (아직 열지 않은 다음 챕터로)
 *   - 스토리 목록에서 이미 고른 칸을 한 번 더 누르거나 더블클릭
 */

type Props = {
  ch1?: Chapter1Save;
  ch2?: Chapter2Save;
  lastChapter?: PlayableId;
  lastPlayedAt?: string;
  /** 해당 챕터 채팅으로 */
  onEnterChapter: (id: PlayableId) => void;
  /** 우상단 네모 — 메인 대시보드로 */
  onBack: () => void;
};

type View = 'dashboard' | 'summary' | 'history';
type Tab = 'about' | 'timeline';

export function CharacterScreen({ ch1, ch2, lastChapter, lastPlayedAt, onEnterChapter, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('about');
  const [tl, setTl] = useState<TimelineAt>({ era: null, event: null });
  const [selected, setSelected] = useState<StoryId | null>(null);
  const [detail, setDetail] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  /** 창 닫기(×) — 대시보드 · 스토리 창을 머리띠만 남기고 접는다 */
  const [folded, setFolded] = useState<{ dash: boolean; story: boolean }>({ dash: false, story: false });

  const view: View = historyOpen ? 'history' : selected ? 'summary' : 'dashboard';
  const entry = selected ? STORY_ENTRIES[selected] : undefined;
  const dash = useMemo(() => dashboardFor({ ch1, ch2 }, lastPlayedAt), [ch1, ch2, lastPlayedAt]);
  const next = nextChapter({ ch1, ch2 }, lastChapter);
  const tuning = TUNING_DEFAULT;

  /** 타임라인 안쪽에 있으면 한 단계씩 되돌아간다. 맨 위에서는 메인 대시보드로 */
  const timelineDepth = tab === 'timeline' ? (tl.event !== null ? 2 : tl.era !== null ? 1 : 0) : 0;
  const exit = () => {
    if (timelineDepth === 2) setTl({ era: tl.era, event: null });
    else if (timelineDepth === 1) setTl({ era: null, event: null });
    else onBack();
  };

  // Esc 도 나가기와 같다 (타임라인 안에서만)
  useEffect(() => {
    if (!timelineDepth) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const selectRow = (id: StoryId) => {
    const row = STORY_ROWS.find((r) => r.id === id);
    if (!row || !STORY_ENTRIES[id]) return;
    if (selected === id && row.playable) {
      onEnterChapter(id as PlayableId);
      return;
    }
    setSelected(id);
    setDetail(null);
    setFolded((f) => ({ ...f, dash: false }));
  };

  return (
    <div className="pr-screen cp-screen" data-node-id={
        tab === 'timeline'
          ? ['1200:12962', '1134:2246', '1134:2308'][timelineDepth]
          : view === 'history'
            ? '1136:4398'
            : entry
              ? '1136:4476'
              : '1136:4249'
      }
    >
      {/* 배경 — 응접실 스케치 · 채도 빼기 · 아래로 어두워지는 막 */}
      <div className="cp-bg" aria-hidden>
        <img src={parlorSketch} alt="" />
      </div>
      <div className={`cp-desaturate${tab === 'timeline' ? ' is-timeline' : ''}`} aria-hidden />
      {tab === 'about' && <div className="cp-vignette" aria-hidden />}

      {/* 타임라인은 배너 · 탭 · 나가기 아래에 깐다 (그늘이 그 위를 덮지 않게) */}
      {tab === 'timeline' && <TimelineView at={tl} onChange={setTl} />}

      {/* 1136:4579 — Character 배너 */}
      <div className="cp-banner" aria-hidden>
        <span>Character</span>
      </div>

      {/* 1136:4373 — 상단 탭 */}
      <nav className="cp-tabs" aria-label="캐릭터 메뉴">
        {TABS.map((t, i) => {
          const id: Tab | null = i === 0 ? 'about' : i === 1 ? 'timeline' : null;
          const on = id === tab;
          return (
            <button
              key={t}
              type="button"
              className={`cp-tab${on ? ' is-active' : ''}`}
              aria-current={on ? 'page' : undefined}
              disabled={!id}
              title={id ? undefined : '준비 중'}
              onClick={() => {
                if (!id) return;
                setTab(id);
                setTl({ era: null, event: null });
              }}
            >
              {t}
            </button>
          );
        })}
      </nav>

      {/* 1136:4425 — 나가기 */}
      <button
        type="button"
        className="cp-exit"
        onClick={exit}
        aria-label={timelineDepth ? '한 단계 뒤로' : '메인 대시보드로'}
      >
        {timelineDepth ? <BackMark /> : <XMark />}
      </button>

      {tab === 'about' && (
        <>

      {/* 1136:4383 — 초상 카드 (채팅 진입) */}
      <button
        type="button"
        className={`cp-portrait${dash.unlocked ? ' is-open' : ''}`}
        onClick={() => onEnterChapter(next.id)}
        aria-label={`${next.title} 대화 시작`}
      >
        <span className="cp-portrait__art" aria-hidden>
          <img src={herPortrait} alt="" />
        </span>
        <span className="cp-portrait__caption">
          <span className="cp-portrait__caption-text">{next.caption}</span>
          <span className="cp-portrait__caption-hover">
            {next.year} · {next.title} 접속
          </span>
        </span>
      </button>

      {/* 1136:4349 — 채팅 기록 */}
      <section className="cp-records" aria-label="채팅 기록">
        <button
          type="button"
          className={`cp-records__open${historyOpen ? ' is-active' : ''}`}
          onClick={() => setHistoryOpen((o) => !o)}
          aria-pressed={historyOpen}
        >
          Chat history
        </button>
        <div className="cp-records__keywords">
          {RECORD_SLOTS.map((s, i) => (
            <span key={i} className="cp-keyword">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* 1137:5127 — 접속 정보 */}
      <section className="cp-tuning" aria-label="접속 정보">
        <p className="cp-tuning__title">· · · now tuning · · · {tuning.year} · · ·</p>
        <div className="cp-tuning__keys">
          <p>DESTINATION ──</p>
          <p>{'YEAR ───────── '}</p>
          <p>STATUS ───────</p>
        </div>
        <div className="cp-tuning__values">
          <p>{tuning.destination}</p>
          <p>{'  ' + tuning.era}</p>
          <p>{'  接續 / connected'}</p>
        </div>
      </section>

      {view === 'history' ? (
        <HistoryWindow lastChapter={lastChapter} onClose={() => setHistoryOpen(false)} />
      ) : (
        <>
          {/* 1136:4778 / 1137:5118 — 대시보드 · Summary 머리띠 */}
          <button
            type="button"
            className="cp-bar cp-bar--dash"
            onClick={() => setFolded((f) => ({ ...f, dash: false }))}
            aria-expanded={!folded.dash}
          >
            {entry ? 'Summary' : 'Dashboard'}
          </button>
          <CloseButton
            className="cp-close--dash"
            label={entry ? '기본 대시보드로' : '대시보드 창 접기'}
            onClick={() => {
              if (entry) {
                setSelected(null);
                setDetail(null);
              } else setFolded((f) => ({ ...f, dash: !f.dash }));
            }}
          />

          {!folded.dash &&
            (entry ? (
              <section className="cp-panel cp-panel--summary" aria-label="스토리 요약">
                <div className="cp-panel__plate" />
                <p className="cp-summary__header">{entry.header}</p>
                <div className="cp-summary__poem">
                  <p>{(detail === null ? entry.poem : entry.buttons[detail].body).join('\n')}</p>
                </div>
                <div className="cp-summary__tags">
                  {entry.buttons.map((b, i) => (
                    <button
                      key={b.label}
                      type="button"
                      className={`cp-summary__tag${detail === i ? ' is-active' : ''}`}
                      onClick={() => setDetail((d) => (d === i ? null : i))}
                      aria-pressed={detail === i}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section className="cp-panel cp-panel--dash" aria-label="대시보드">
                <div className="cp-panel__plate" />
                <dl className="cp-dash">
                  {dash.rows.map((r, i) => (
                    <div key={r.label} className={`cp-dash__row cp-dash__row--${i + 1}`}>
                      <dt className="cp-chip">{r.label}</dt>
                      <dd className={`cp-dash__value${r.value ? ' is-open' : ''}`}>{r.value ?? '대화 시 해금'}</dd>
                    </div>
                  ))}
                  <div className="cp-dash__row cp-dash__row--story">
                    <dt className="cp-chip">Our Story</dt>
                    <dd className="cp-dash__big">{dash.story}</dd>
                  </div>
                  <div className="cp-dash__row cp-dash__row--last">
                    <dt className="cp-chip">last shegnal</dt>
                    <dd className="cp-dash__big">{dash.lastAt}</dd>
                  </div>
                </dl>
              </section>
            ))}

          {/* 1136:4825 — 스토리 머리띠 */}
          <button
            type="button"
            className="cp-bar cp-bar--story"
            onClick={() => setFolded((f) => ({ ...f, story: false }))}
            aria-expanded={!folded.story}
          >
            Story
          </button>
          <CloseButton
            className="cp-close--story"
            label="스토리 창 접기"
            onClick={() => setFolded((f) => ({ ...f, story: !f.story }))}
          />

          {/* 1136:4276 — 스토리 목록 */}
          {!folded.story && (
            <section className="cp-panel cp-panel--story" aria-label="스토리">
              <ol className="cp-stories">
                {STORY_ROWS.map((r) => {
                  const selectable = Boolean(STORY_ENTRIES[r.id]);
                  const cls = [
                    'cp-story',
                    r.locked && 'is-locked',
                    selected === r.id && 'is-selected',
                    selectable && 'is-selectable',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        className={cls}
                        onClick={() => selectRow(r.id)}
                        onDoubleClick={() => r.playable && onEnterChapter(r.id as PlayableId)}
                        disabled={!selectable}
                        aria-pressed={selected === r.id}
                        title={r.playable ? (selected === r.id ? '한 번 더 누르면 대화를 시작해요' : undefined) : undefined}
                      >
                        <span className="cp-cell cp-cell--year">{r.year}</span>
                        <span className="cp-cell cp-cell--title">{r.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </>
      )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 1136:4398 — Chat history 창
 * ------------------------------------------------------------------------- */

const HISTORY_IDS: Partial<Record<StoryId, HistoryChapter>> = { prologue: 'prologue', ch1: 'ch1', ch2: 'ch2' };

function HistoryWindow({ lastChapter, onClose }: { lastChapter?: PlayableId; onClose: () => void }) {
  const all = useMemo(() => {
    const out: Partial<Record<HistoryChapter, HistorySession[]>> = {};
    for (const id of ['prologue', 'ch1', 'ch2'] as HistoryChapter[]) out[id] = loadHistory(id);
    return out;
  }, []);

  const [chapter, setChapter] = useState<HistoryChapter>(() => {
    if (lastChapter && all[lastChapter]?.length) return lastChapter;
    const withLog = (['ch2', 'ch1', 'prologue'] as HistoryChapter[]).find((id) => all[id]?.length);
    return withLog ?? 'prologue';
  });
  const sessions = all[chapter] ?? [];

  return (
    <>
      <p className="cp-bar cp-bar--history">Chat history</p>
      <CloseButton className="cp-close--history" label="대시보드로" onClick={onClose} />

      <section className="cp-panel cp-panel--history" aria-label="채팅 기록">
        <div className="cp-panel__plate" />

        {/* 1137:4951 — 챕터 칸 */}
        <ol className="cp-history__chapters">
          {STORY_ROWS.map((r) => {
            const id = HISTORY_IDS[r.id];
            const has = Boolean(id && all[id]?.length);
            const on = id === chapter;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className={`cp-cell cp-cell--year cp-history__chapter${on ? ' is-on' : has ? ' has-log' : ''}`}
                  disabled={!id}
                  onClick={() => id && setChapter(id)}
                  aria-pressed={on}
                  title={id && !has ? '아직 나눈 대화가 없어요' : undefined}
                >
                  {r.locked ? '?' : r.year}
                </button>
              </li>
            );
          })}
        </ol>

        {/* 1136:4426 — 대화 종이 */}
        <div className="cp-paper">
          <p className="cp-paper__header">{HISTORY_HEADERS[chapter]}</p>
          <ScrollLog key={chapter} sessions={sessions} />
        </div>
      </section>
    </>
  );
}

function ScrollLog({ sessions }: { sessions: HistorySession[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ top: 0, size: 1 });
  const drag = useRef<{ y: number; scroll: number } | null>(null);

  const measure = () => {
    const el = box.current;
    if (!el) return;
    const size = Math.min(1, el.clientHeight / Math.max(1, el.scrollHeight));
    const max = el.scrollHeight - el.clientHeight;
    setThumb({ top: max > 0 ? el.scrollTop / max : 0, size });
  };

  // 처음 열면 가장 최근 대화가 보이게 맨 아래로
  useLayoutEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
    measure();
  }, [sessions]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = box.current;
      if (!drag.current || !el) return;
      const track = TRACK_H - TRACK_PAD * 2;
      const thumbPx = Math.max(THUMB_MIN, track * (el.clientHeight / el.scrollHeight));
      const scale = (el.scrollHeight - el.clientHeight) / Math.max(1, track - thumbPx);
      // 스테이지가 축소되어 있으면 화면 픽셀과 아트보드 픽셀이 다르다
      const zoom = el.getBoundingClientRect().height / el.clientHeight || 1;
      el.scrollTop = drag.current.scroll + ((e.clientY - drag.current.y) / zoom) * scale;
    };
    const onUp = () => (drag.current = null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const track = TRACK_H - TRACK_PAD * 2;
  const thumbPx = Math.max(THUMB_MIN, track * thumb.size);
  const scrollable = thumb.size < 1;

  return (
    <>
      <div className="cp-paper__scroll" ref={box} onScroll={measure} tabIndex={0} aria-label="대화 내용">
        {sessions.length === 0 ? (
          <p className="cp-paper__empty">아직 나눈 대화가 없어요.</p>
        ) : (
          sessions.map((s, si) => (
            <div key={s.id} className="cp-paper__session">
              {(sessions.length > 1 || si > 0) && <p className="cp-paper__date">— {s.at} —</p>}
              {s.lines.map((l, i) =>
                l.from === 'her' ? (
                  <p key={i} className="cp-line cp-line--her">
                    {l.text}
                  </p>
                ) : (
                  <p key={i} className="cp-line cp-line--you">
                    {l.text}
                  </p>
                ),
              )}
            </div>
          ))
        )}
      </div>

      {/* 1136:4437 — 스크롤 막대 */}
      <div
        className={`cp-paper__track${scrollable ? '' : ' is-idle'}`}
        aria-hidden
        onPointerDown={(e) => {
          const el = box.current;
          if (!el || e.target !== e.currentTarget) return;
          const r = e.currentTarget.getBoundingClientRect();
          const up = e.clientY < r.top + (TRACK_PAD + thumb.top * (track - thumbPx)) * (r.height / TRACK_H);
          el.scrollBy({ top: (up ? -1 : 1) * el.clientHeight * 0.9, behavior: 'smooth' });
        }}
      >
        <span
          className="cp-paper__thumb"
          style={{ top: TRACK_PAD + thumb.top * (track - thumbPx), height: thumbPx }}
          onPointerDown={(e) => {
            if (!box.current) return;
            e.preventDefault();
            drag.current = { y: e.clientY, scroll: box.current.scrollTop };
          }}
        />
      </div>
    </>
  );
}

const TRACK_H = 356;
const TRACK_PAD = 11;
const THUMB_MIN = 40;

/* ---------------------------------------------------------------------------
 * 손그림 × 버튼 (Component 5 테두리 위에 × 를 긋는다)
 * ------------------------------------------------------------------------- */

function CloseButton({ className, label, onClick }: { className: string; label: string; onClick: () => void }) {
  return (
    <button type="button" className={`cp-close ${className}`} onClick={onClick} aria-label={label}>
      <XMark />
    </button>
  );
}

/** 타임라인 안쪽에서 나가기 버튼 — 한 단계 뒤로 (‹) */
function BackMark() {
  return (
    <svg className="cp-x cp-x--back" viewBox="0 0 24 24" aria-hidden>
      <path d="M15.6 4.4 C12.4 7.6 9.9 10.1 7.4 12.2 C10 14.6 12.6 17.1 15.8 20" />
    </svg>
  );
}

function XMark() {
  return (
    <svg className="cp-x" viewBox="0 0 24 24" aria-hidden>
      <path d="M4.2 4.6 C9 9.1 14.6 14.9 19.6 19.5" />
      <path d="M19.4 4.3 C14.4 9.4 9.6 14.2 4.5 19.7" />
    </svg>
  );
}
