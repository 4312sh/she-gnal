import { useEffect, useState } from 'react';

import { ERAS, OPEN_EVENTS } from './timelineData';
import './timeline.css';

/**
 * 과거 · 캐릭터 타임라인
 *   1200:12962  시간대          — 선 위아래로 시간대 동그라미 넷
 *   1200:13016  시간대 선택     — 가리킨 동그라미가 밝아진다 (hover · focus)
 *   1134:2246   시간대 상세     — 왼쪽 큰 반원(연도) + 사건 동그라미 셋
 *   1134:2308   사건 상세       — 본문 · 해시태그 · ‹ › · 그녀의 한마디
 *
 * 단계(era · event)는 CharacterScreen 이 들고 있다 — 우상단 나가기 버튼이 한 단계씩 되돌아가야 해서.
 */

export type TimelineAt = { era: number | null; event: number | null };

type Props = {
  at: TimelineAt;
  onChange: (next: TimelineAt) => void;
};

/** 시간대 동그라미 자리 (Figma 좌상단) — 1913 · 1919 · 1928 · 1935 */
const ERA_POS: [number, number][] = [
  [317, 667],
  [675, 333],
  [1038, 667],
  [1393, 333],
];

/** 사건 동그라미 자리 (1134:2252 · 2258 · 2255) */
const EVENT_LEFT = [467, 815.69, 1164.38];

export function TimelineView({ at, onChange }: Props) {
  const era = at.era === null ? null : ERAS[at.era];
  const event = era && at.event !== null ? era.events[at.event] : null;

  return (
    <div className={`tl-root tl-root--${event ? 'event' : era ? 'era' : 'list'}`}>
      <div className="tl-shade-top" aria-hidden />
      <div className="tl-shade-bottom" aria-hidden />

      {event && era ? (
        <EventDetail at={at} onChange={onChange} />
      ) : era ? (
        <>
          {/* 1134:2270 — 왼쪽 큰 반원: 누르면 시간대 목록으로 */}
          <button
            type="button"
            className="tl-era-big"
            onClick={() => onChange({ era: null, event: null })}
            aria-label="시간대 목록으로"
          >
            <span>
              {era.from}-{era.to}
            </span>
          </button>

          {era.events.map((ev, i) => (
            <button
              key={ev.id}
              type="button"
              className={`tl-event${ev.sealed ? ' is-sealed' : ''}`}
              style={{ left: EVENT_LEFT[i] }}
              disabled={ev.sealed}
              onClick={() => onChange({ era: at.era, event: i })}
              title={ev.sealed ? '아직 그녀에게 오지 않은 시간' : undefined}
            >
              <span>{ev.label}</span>
            </button>
          ))}
        </>
      ) : (
        <>
          {/* 1200:12975 — 가로선 */}
          <div className="tl-line" aria-hidden />
          {ERAS.map((e, i) => {
            const [x, y] = ERA_POS[i];
            const cx = x + 106.776;
            return (
              <div key={e.id}>
                <span className={`tl-connector tl-connector--${e.side}`} style={{ left: cx - 10.45 }} aria-hidden />
                <button
                  type="button"
                  className="tl-era"
                  style={{ left: x, top: y }}
                  onClick={() => onChange({ era: i, event: null })}
                  aria-label={`${e.from}년부터 ${e.to}년까지`}
                >
                  <span>
                    {e.from}
                    <br />
                    {e.to}
                  </span>
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 1134:2308 — 사건 상세
 * ------------------------------------------------------------------------- */

function EventDetail({ at, onChange }: Props) {
  const era = ERAS[at.era ?? 0];
  const ev = era.events[at.event ?? 0];
  const [tag, setTag] = useState<number | null>(null);

  const pos = OPEN_EVENTS.findIndex((p) => p.era === at.era && p.event === at.event);
  const prev = pos > 0 ? OPEN_EVENTS[pos - 1] : null;
  const next = pos >= 0 && pos < OPEN_EVENTS.length - 1 ? OPEN_EVENTS[pos + 1] : null;
  const go = (p: { era: number; event: number } | null) => {
    if (!p) return;
    setTag(null);
    onChange({ era: p.era, event: p.event });
  };

  // ← → 로도 넘긴다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prev) go(prev);
      if (e.key === 'ArrowRight' && next) go(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const tags = ev.tags ?? [];
  const body = tag === null ? ev.body : tags[tag].body.join('\n');

  return (
    <>
      <button
        type="button"
        className="tl-arrow tl-arrow--prev"
        onClick={() => go(prev)}
        disabled={!prev}
        aria-label="이전 사건"
      />
      <button
        type="button"
        className="tl-arrow tl-arrow--next"
        onClick={() => go(next)}
        disabled={!next}
        aria-label="다음 사건"
      />

      {/* 1134:2314 — 판 */}
      <section className="tl-detail" aria-label={ev.header}>
        <div className="tl-detail__plate">
          <p className="tl-detail__header">{ev.header}</p>
          <div className={`tl-detail__row${tags.length ? '' : ' is-wide'}`}>
            <div className="tl-detail__body">
              <p key={`${ev.id}-${tag}`}>{body}</p>
            </div>
            {tags.length > 0 && (
              <div className="tl-detail__tags">
                {tags.map((t, i) => (
                  <button
                    key={t.label}
                    type="button"
                    className={`tl-detail__tag${tag === i ? ' is-active' : ''}`}
                    onClick={() => setTag((v) => (v === i ? null : i))}
                    aria-pressed={tag === i}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 1134:2325 — 그녀의 한마디 */}
      {ev.quote && (
        <p className="tl-quote" key={ev.id}>
          {ev.quote}
        </p>
      )}
    </>
  );
}
