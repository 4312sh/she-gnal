import { useEffect, useMemo, useRef, useState } from 'react'
import header from '../../assets/view-character/header.svg'
import type { Player } from '../../game/types'
import {
  ERA_ORDER,
  PROFILES,
  TIMELINES,
  defaultLooks,
  lastDate,
  loadChats,
  recentEra,
  type ChatEntry,
  type EraKey,
} from './viewCharacterData'
import type { AvatarImage } from './avatars'
import './viewCharacter.css'

type Props = {
  player: Partial<Player>
  /** GO TO MAIN */
  onGoMain: () => void
}

type View = 'home' | 'era' | 'timeline' | 'chat'
type ChatFilter = 'recent' | EraKey

/** 드롭다운 삼각형 (Figma Polygon 1) */
function Caret({ open = false }: { open?: boolean }) {
  return (
    <svg className={`vc-caret${open ? ' is-open' : ''}`} width="15" height="10" viewBox="0 0 15 10" aria-hidden>
      <path d="M7.8 8.8C7.4 9.3 6.7 9.3 6.3 8.8L0.2 1.6C-0.3 1 0.2 0 1 0L13.2 0C14 0 14.5 1 13.9 1.6L7.8 8.8Z" />
    </svg>
  )
}

/** 동그란 프로필 사진 — 75px 칸은 150px, 120px 칸은 240px 원본 (2배) */
function Avatar({ era, size, image }: { era: EraKey; size: 75 | 120; image: AvatarImage }) {
  return (
    <span className={`vc-avatar vc-avatar--${era}`} style={{ width: size, height: size }}>
      <img src={size === 75 ? image.sm : image.lg} alt="" draggable={false} />
    </span>
  )
}

/** 패널 왼쪽 위 드롭다운 (PAST ▾ / RECENT ▾) */
function PanelSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: T[]
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`vc-select${open ? ' is-open' : ''}`}>
      <button type="button" className="vc-select__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'now..' : value}
        <Caret open={open} />
      </button>
      {open && (
        <ul className="vc-select__list" role="listbox">
          {options.map((o) => (
            <li key={o}>
              <button
                type="button"
                role="option"
                aria-selected={o === value}
                className={o === value ? 'is-current' : ''}
                onClick={() => {
                  onChange(o)
                  setOpen(false)
                }}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Figma 1343:36290 · 1454:1261 · 1462:2683 — STORY TIMELINE */
function TimelinePanel({ initialEra }: { initialEra: EraKey }) {
  const [era, setEra] = useState<EraKey>(initialEra)
  const items = TIMELINES[era]
  const [selectedId, setSelectedId] = useState(items[Math.min(1, items.length - 1)]?.id)
  const selected = items.find((i) => i.id === selectedId) ?? items[0]

  const changeEra = (e: EraKey) => {
    setEra(e)
    setSelectedId(TIMELINES[e][0]?.id)
  }

  return (
    <div className={`vc-panel vc-panel--timeline vc-era--${era}`}>
      <div className="vc-panel__list">
        <PanelSelect value={era} options={ERA_ORDER} onChange={changeEra} />
        <ul className="vc-list">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                className={`vc-list__item${it.id === selected?.id ? ' is-selected' : ''}`}
                onClick={() => setSelectedId(it.id)}
              >
                <Avatar era={era} size={75} image={it.avatar} />
                <span className="vc-list__text">
                  <span className="vc-list__title">{it.title}</span>
                  <span className="vc-list__sub">{it.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="vc-panel__body">
        {selected && (
          <div key={`${era}-${selected.id}`} className="vc-story">
            <div className="vc-story__head">
              <span className="vc-story__chip">{selected.heading}</span>
              <p className="vc-story__summary">
                {selected.summary.map((l, i) => (
                  <span key={i}>
                    {l}
                    {i < selected.summary.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
            <div className="vc-story__unlocks">
              {selected.unlocks.map((u, i) => (
                <span key={i} className={`vc-unlock${u ? ' is-open' : ''}`}>
                  {u ?? '/캐릭터 해금 요소/'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Figma 1335:35165 · 1455:2031 — CHAT HISTORY */
function ChatPanel({ chats }: { chats: ChatEntry[] }) {
  const [filter, setFilter] = useState<ChatFilter>('recent')
  const list = filter === 'recent' ? chats : chats.filter((c) => c.era === filter)
  const [selectedKey, setSelectedKey] = useState<string | undefined>(list[0]?.key)
  const selected = list.find((c) => c.key === selectedKey) ?? list[0]
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [selected?.key])

  const lines = selected?.sessions.flatMap((s) => s.lines) ?? []
  // 연속된 그녀의 말은 아바타 하나에 묶는다 (Figma: 아바타 + 말풍선 둘)
  const groups: { from: 'her' | 'you'; texts: string[] }[] = []
  for (const l of lines) {
    const last = groups[groups.length - 1]
    if (last && last.from === l.from) last.texts.push(l.text)
    else groups.push({ from: l.from, texts: [l.text] })
  }

  return (
    <div className={`vc-panel vc-panel--chat${selected ? ` vc-era--${selected.era}` : ''}`}>
      <div className="vc-panel__list">
        <PanelSelect<ChatFilter>
          value={filter}
          options={['recent', ...ERA_ORDER]}
          onChange={(f) => {
            setFilter(f)
            setSelectedKey(undefined)
          }}
        />
        <ul className="vc-list">
          {list.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                className={`vc-list__item${c.key === selected?.key ? ' is-selected' : ''}`}
                onClick={() => setSelectedKey(c.key)}
              >
                <Avatar era={c.era} size={75} image={c.avatar} />
                <span className="vc-list__text">
                  <span className="vc-list__title">{c.name}</span>
                  <span className="vc-list__sub">
                    {c.title} · {c.at}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!list.length && <li className="vc-list__empty">아직 나눈 대화가 없어요</li>}
        </ul>
      </div>

      <div className="vc-panel__body vc-chat" ref={bodyRef}>
        {selected ? (
          <>
            <p className="vc-chat__head">
              <span className="vc-chat__title">{selected.title}</span>
              <span className="vc-chat__label">{selected.label}</span>
            </p>
            <div className="vc-chat__log">
              {groups.map((g, i) =>
                g.from === 'her' ? (
                  <div key={i} className="vc-chat__her">
                    <Avatar era={selected.era} size={120} image={selected.avatar} />
                    <div className="vc-chat__bubbles">
                      {g.texts.map((t, j) => (
                        <p key={j} className="vc-bubble vc-bubble--her">
                          {t}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="vc-chat__you">
                    {g.texts.map((t, j) => (
                      <p key={j} className="vc-bubble vc-bubble--you">
                        {t}
                      </p>
                    ))}
                  </div>
                ),
              )}
            </div>
          </>
        ) : (
          <p className="vc-chat__empty">대화를 나누면 여기에 기록이 남아요</p>
        )}
      </div>
    </div>
  )
}

/**
 * View charactor (Figma 1288:33279 "기본 셋팅" 기준)
 *   home     : 가장 최근에 대화를 나눈 캐릭터 · CHARACTOR ▾ (1477:13983)
 *   era      : 시대별 캐릭터 대시보드 — 과거 1288:32282 / 현재 1447:834 / 미래 1447:1253
 *   timeline : STORY TIMELINE 창 (과거 1343:36290 / 현재 1454:1261 / 미래 1462:2683)
 *   chat     : CHAT HISTORY 창 (1335:35165 · 드롭다운 1455:2031)
 */
export function ViewCharacterScreen({ player, onGoMain }: Props) {
  const chats = useMemo(() => loadChats(), [])
  const recent = recentEra(player, chats)
  const date = lastDate(player, chats)

  const [view, setView] = useState<View>('home')
  const [era, setEra] = useState<EraKey>(recent)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoverEra, setHoverEra] = useState<EraKey>(recent)
  /** 시대마다 고른 캐릭터 상태 (looks 의 순번) */
  const [looks, setLooks] = useState<Record<EraKey, number>>(() => defaultLooks(chats))

  // 시대 화면만 고른 시대, 기본 화면 · 창에서는 가장 최근 캐릭터
  const shownEra: EraKey = view === 'era' ? era : recent
  const profile = PROFILES[shownEra]
  const look = profile.looks[looks[shownEra]] ?? profile.looks[0]
  const panelOpen = view === 'timeline' || view === 'chat'

  const openEra = (e: EraKey) => {
    setEra(e)
    setMenuOpen(false)
    setView('era')
  }

  // ESC: 드롭다운 → 창 → 시대 화면 순으로 닫는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (menuOpen) setMenuOpen(false)
      else if (view !== 'home') setView('home')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, view])

  return (
    <div
      className={`vc vc--${view} vc-era--${shownEra}${panelOpen ? ' has-panel' : ''}`}
      data-node-id="1288:33279"
    >
      {/* 위 곡선 막대 + GO TO MAIN */}
      <img className="layer vc-header" src={header} alt="" />
      <button type="button" className="vc-gomain" onClick={onGoMain}>
        go to main
      </button>

      {/* 가운데 캐릭터 — 기본 화면은 가장 최근에 대화를 나눈 캐릭터, 시대 화면은 고른 상태 */}
      {/* 그림이 하나만 남도록 고정된 틀 안에서 img 만 바꾼다 (바뀔 때 페이드) */}
      <div className="vc-figure">
        <img key={look.figure} src={look.figure} alt={`${profile.name} · ${look.label}`} draggable={false} />
      </div>
      <div className="vc-shade" aria-hidden />

      {/* 왼쪽 위: CHARACTOR ▾ · 이름 · 상태 */}
      <div className={`vc-dim${panelOpen ? ' is-dim' : ''}`}>
        <div className={`vc-menu${menuOpen ? ' is-open' : ''}`}>
          <button
            type="button"
            className={`vc-pill vc-menu__head${view === 'era' ? ' is-era' : ''}`}
            onClick={() => !panelOpen && setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            disabled={panelOpen}
          >
            <span>{view === 'era' ? era : 'charactor'}</span>
            <Caret open={menuOpen} />
          </button>
          {menuOpen && (
            <ul className="vc-menu__list">
              {ERA_ORDER.map((e) => (
                <li key={e}>
                  <button
                    type="button"
                    className={e === hoverEra ? 'is-current' : ''}
                    onMouseEnter={() => setHoverEra(e)}
                    onFocus={() => setHoverEra(e)}
                    onClick={() => openEra(e)}
                  >
                    {e}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {menuOpen ? (
          <ul className="vc-states">
            {PROFILES[hoverEra].looks.map((l, i) => (
              <li key={l.label}>
                <button
                  type="button"
                  className={looks[hoverEra] === i ? 'is-current' : ''}
                  onClick={() => {
                    setLooks((st) => ({ ...st, [hoverEra]: i }))
                    openEra(hoverEra)
                  }}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <span className={`vc-box vc-box--name${view === 'era' ? ' is-era' : ''}`}>
              {view !== 'era' && !chats.length && !player.lastPlayed ? '/charactor name/' : profile.name}
            </span>
            <span className="vc-box vc-box--state">{look.label}</span>
          </>
        )}
      </div>

      {/* 오른쪽 위: STORY TIMELINE · CHAT HISTORY (기본) / BACK (시대 · 창) */}
      {view === 'home' && (
        <div className="vc-top-right">
          <button type="button" className="vc-pill" onClick={() => setView('timeline')}>
            story timeline
          </button>
          <button type="button" className="vc-pill" onClick={() => setView('chat')}>
            chat history
          </button>
        </div>
      )}
      {view !== 'home' && (
        <button type="button" className="vc-pill vc-back" onClick={() => setView('home')}>
          back
        </button>
      )}

      {/* 아래: DASHBOARD · LAST SHEGNAL (기본) / 시대 대시보드 */}
      {!panelOpen && (
        <button
          type="button"
          className={`vc-pill vc-dashboard${view === 'era' ? ' is-active' : ''}`}
          onClick={() => view === 'home' && openEra(recent)}
        >
          dashboard
        </button>
      )}
      {view === 'era' ? (
        <div className="vc-stats" key={`${era}-${look.label}`}>
          <div className="vc-tags">
            <span className="vc-tag" style={{ left: 252 }}>
              <span className="vc-tag__label">WORK</span>
              <span className="vc-tag__value">{look.work}</span>
            </span>
            <span className="vc-tag" style={{ left: 580 }}>
              <span className="vc-tag__label">MARITAL</span>
              <span className="vc-tag__value">{look.marital}</span>
            </span>
            <span className="vc-tag" style={{ left: 907 }}>
              <span className="vc-tag__label">RELATION</span>
              <span className="vc-tag__value">{look.relation}</span>
            </span>
          </div>
          <div className="vc-unlocks">
            {look.keywords.map((k) => (
              <span key={k} className="vc-unlock is-open">
                {k}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className={`vc-dim${panelOpen ? ' is-dim' : ''}`}>
          <span className="vc-pill vc-last">last shegnal</span>
          {(menuOpen || panelOpen || date) && <span className="vc-date">{date ?? '/date/'}</span>}
        </div>
      )}

      {/* 창 */}
      {view === 'timeline' && (
        <>
          <span className="vc-pill is-active vc-panel-tag">story timeline</span>
          <TimelinePanel initialEra={recent} />
        </>
      )}
      {view === 'chat' && (
        <>
          <span className="vc-pill is-active vc-panel-tag">chat history</span>
          <ChatPanel chats={chats} />
        </>
      )}

      {menuOpen && <button type="button" className="vc-scrim" aria-label="닫기" onClick={() => setMenuOpen(false)} />}
    </div>
  )
}
