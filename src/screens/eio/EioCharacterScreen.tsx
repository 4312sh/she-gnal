import { useState } from 'react'

import { EIO_LAST, EIO_STORIES, EIO_TABS, EIO_TUNING, type EioTab } from './eioData'
import './eio.css'
import eioBg from '../../assets/character/future/eio-bg.jpg'
import eioSway from '../../assets/character/future/eio-sway.webp'

/**
 * 캐릭터 화면 — 이오 (미래)
 *
 *   1169:9679  대시보드 (기본)
 *   1169:9569  STORY 를 누르면 → 스토리 목록이 펼쳐짐 (v 로 접기)
 *   1169:9630  목록에서 스토리를 누르면 → SUMMARY 창
 *   1169:10250 CHAT HISTORY 를 누르면 → 대화 기록 창
 *
 * 좌표는 Figma 1920×1080 아트보드 기준 (eio.css).
 * 배경 그래픽은 assets/character/future/eio-bg.jpg. 전신은 assets/character/future/eio-sway.webp (블렌더 렌더 루프) — art 로 넘기면 바로 들어감.
 */

export type EioArt = {
  /** 흐린 배경 사진 (Figma: 스크린샷 2026-10-11 오후 7.50.26) */
  background?: string
  /** 상단 색 띠 (Figma: Rectangle 35) */
  strip?: string
  /** 가운데 전신 (Figma: image 27) */
  figure?: string
  /** 전신 움직임 — 틀 위쪽에 맞춰 놓는 애니메이션(webp). figure 보다 우선 */
  figureMotion?: string
}

type Pane = 'none' | 'summary' | 'history'

type Props = {
  art?: EioArt
  /** 마지막 접속 (예: 26. 10. 11) */
  lastAt?: string
  /** 스토리 대화로 — Summary 창의 스토리 칩을 누르면 들어간다 */
  onEnterStory?: (id: string) => void
  initialTab?: EioTab
  /** 우상단 X — 메인 대시보드로 */
  onBack: () => void
}

function Chevron({ onClick, className, label }: { onClick: () => void; className: string; label: string }) {
  return (
    <button type="button" className={`eo-chevron ${className}`} onClick={onClick} aria-label={label}>
      <svg width="36" height="20" viewBox="0 0 36 20" fill="none" aria-hidden>
        <rect x="0.5" y="0.5" width="35" height="19" rx="3.5" stroke="#0426F5" />
        <path d="M17.9 11.9H18L20.5 7H22L18.8 13H17.2L14 7H15.5L17.9 11.9Z" fill="#0426F5" />
      </svg>
    </button>
  )
}

const DEFAULT_ART: EioArt = { background: eioBg, figureMotion: eioSway }

export function EioCharacterScreen({ art: artProp = {}, lastAt = EIO_LAST.at, initialTab = 'about', onEnterStory, onBack }: Props) {
  const art = { ...DEFAULT_ART, ...artProp }
  const [tab, setTab] = useState<EioTab>(initialTab)
  const [storyOpen, setStoryOpen] = useState(false)
  const [pane, setPane] = useState<Pane>('none')
  const [selected, setSelected] = useState(EIO_STORIES[0].id)
  const story = EIO_STORIES.find((s) => s.id === selected) ?? EIO_STORIES[0]
  const lastStory = EIO_STORIES.find((s) => s.id === EIO_LAST.story)

  const openStory = (id: string) => {
    setSelected(id)
    setPane('summary')
  }

  return (
    <div className="eo-screen">
      {/* 1169:9680 — 흐린 배경 사진 */}
      <div className={`eo-bg${art.background ? '' : ' is-placeholder'}`} aria-hidden>
        {art.background && <img src={art.background} alt="" />}
      </div>
      {/* 1169:9681 — 상단 색 띠 */}
      {/* 배경 그래픽에 색 띠가 이미 들어 있어서, 따로 받은 띠가 있을 때만 얹는다 */}
      {art.strip && (
        <div className="eo-strip" aria-hidden>
          <img src={art.strip} alt="" />
        </div>
      )}
      {/* 1169:9700 — 전신 */}
      <div className={`eo-figure${art.figure || art.figureMotion ? '' : ' is-placeholder'}`} aria-hidden>
        {art.figureMotion ? (
          /* 블렌더 렌더 · 좌우로 살짝 흔들리는 4초 루프 (557×918, 투명 배경) */
          <img className="eo-figure__motion" src={art.figureMotion} alt="" />
        ) : (
          art.figure && <img src={art.figure} alt="" />
        )}
      </div>

      {/* ---- 상단 바 ---- */}
      <span className="eo-badge">Charactor</span>
      <nav className="eo-tabs" aria-label="캐릭터 메뉴">
        {EIO_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`eo-tab${t.id === tab ? ' is-active' : ''}`}
            aria-current={t.id === tab ? 'page' : undefined}
            disabled={!t.ready}
            title={t.ready ? undefined : '준비 중'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <button type="button" className="eo-close" onClick={onBack} aria-label="메인 대시보드로">
        <svg width="53" height="53" viewBox="0 0 53 53" fill="none" aria-hidden>
          <rect width="53" height="53" rx="8" fill="url(#eo-close-a)" fillOpacity="0.4" />
          <path
            d="M33.6 25.9C33.3 26.3 33.3 26.9 33.6 27.3L42.8 36.5C43.2 36.9 43.2 37.5 42.8 37.9L38.6 42.1C38.2 42.5 37.6 42.5 37.2 42.1L28 32.9C27.6 32.6 27 32.6 26.6 32.9L16.7 42.8C16.3 43.2 15.7 43.2 15.3 42.8L11 38.6C10.6 38.2 10.6 37.6 11 37.2L20.9 27.3C21.3 26.9 21.3 26.3 20.9 25.9L11 16C10.6 15.6 10.6 14.9 11 14.6L15.3 10.3C15.7 9.9 16.3 9.9 16.7 10.3L26.6 20.2C27 20.6 27.6 20.6 28 20.2L37.2 11C37.6 10.6 38.2 10.6 38.6 11L42.8 15.3C43.2 15.7 43.2 16.3 42.8 16.7L33.6 25.9Z"
            fill="url(#eo-close-b)"
          />
          <defs>
            <linearGradient id="eo-close-a" x1="0" y1="26.5" x2="53" y2="26.5" gradientUnits="userSpaceOnUse">
              <stop offset="0.5" stopColor="#C8D9F3" />
              <stop offset="1" stopColor="#EAEAEA" />
            </linearGradient>
            <linearGradient id="eo-close-b" x1="12.8" y1="40.4" x2="40.4" y2="12.8" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D9D9D9" stopOpacity="0.2" />
              <stop offset="1" stopColor="white" />
            </linearGradient>
          </defs>
        </svg>
      </button>

      {/* ---- 왼쪽: STORY ---- */}
      <button
        type="button"
        className="eo-label eo-label--story"
        onClick={() => setStoryOpen((o) => !o)}
        aria-expanded={storyOpen}
      >
        STORY
      </button>
      {storyOpen && pane !== 'history' && (
        <>
          <Chevron className="eo-chevron--story" label="스토리 목록 접기" onClick={() => setStoryOpen(false)} />
          {/* 1169:9595 — 스토리 목록 */}
          <ul className="eo-stories">
            {EIO_STORIES.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`eo-story${s.locked ? ' is-locked' : ''}`}
                  disabled={s.locked}
                  onClick={() => openStory(s.id)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 1170:10656 — 마지막 접속 */}
      <dl className="eo-last">
        <dt className="eo-last__key eo-last__key--story">OUR STORY</dt>
        <dd className="eo-last__val eo-last__val--story">{lastStory?.label.toLowerCase()}</dd>
        <dt className="eo-last__key eo-last__key--signal">LAST SHEGNAL</dt>
        <dd className="eo-last__val eo-last__val--signal">{lastAt}</dd>
      </dl>

      {/* 1169:10244 — 접속 정보 */}
      <section className="eo-tuning" aria-label="접속 정보">
        <p className="eo-tuning__title">· · · now tuning · · · {EIO_TUNING.year} · · ·</p>
        <div className="eo-tuning__keys">
          <p>DESTINATION ──</p>
          <p>{'YEAR ───────── '}</p>
          <p>STATUS ───────</p>
        </div>
        <div className="eo-tuning__values">
          <p>{EIO_TUNING.destination}</p>
          <p>{`  ${EIO_TUNING.era}`}</p>
          <p>{`  ${EIO_TUNING.status}`}</p>
        </div>
      </section>

      {/* ---- 기본: DASHBOARD 라벨 + 오른쪽 CHAT HISTORY ---- */}
      {pane === 'none' && !storyOpen && <span className="eo-label eo-label--dashboard">DASHBOARD</span>}
      {pane === 'none' && (
        <button type="button" className="eo-label eo-label--blue eo-label--history" onClick={() => setPane('history')}>
          CHAT HISTORY
        </button>
      )}

      {/* ---- 1169:9630 — SUMMARY ---- */}
      {pane === 'summary' && (
        <>
          <span className="eo-label eo-label--summary">SUMMARY</span>
          <Chevron className="eo-chevron--summary" label="요약 닫기" onClick={() => setPane('none')} />
          <section className="eo-summary" aria-label={`${story.label} 요약`}>
            <div className="eo-summary__card">
              {onEnterStory && !story.locked ? (
                <button
                  type="button"
                  className="eo-chip eo-chip--enter"
                  onClick={() => onEnterStory(story.id)}
                  title="대화로 들어가기"
                >
                  {story.label} ▶
                </button>
              ) : (
                <span className="eo-chip">{story.label}</span>
              )}
              <p className="eo-summary__text">{story.summary}</p>
            </div>
            <ul className="eo-tags">
              {story.tags.map((t, i) => (
                <li key={i} className="eo-tag">
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* ---- 1169:10250 — CHAT HISTORY ---- */}
      {pane === 'history' && (
        <>
          <span className="eo-label eo-label--blue eo-label--history-open">CHAT HISTORY</span>
          <Chevron className="eo-chevron--history" label="대화 기록 닫기" onClick={() => setPane('none')} />
          <section className="eo-history" aria-label="대화 기록">
            <ul className="eo-history__list">
              {EIO_STORIES.filter((s) => !s.locked).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`eo-history__item${s.id === story.id ? ' is-active' : ''}`}
                    onClick={() => setSelected(s.id)}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="eo-history__log">
              <span className="eo-chip eo-chip--outline">{story.label}</span>
              <ol className="eo-log">
                {story.chat.map((line, i) => (
                  <li key={i} className={`eo-line eo-line--${line.from}`}>
                    {line.text}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
