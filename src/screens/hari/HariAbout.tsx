import { useMemo, useState } from 'react'

import minusIcon from '../../assets/hari/minus.svg'
import portraitRing from '../../assets/hari/portrait-ring.svg'
import dashLine from '../../assets/hari/dash-line.svg'
import storyLine from '../../assets/hari/story-line.svg'
import { loadHistory, type HistorySession } from '../../game/chatHistory'
import {
  HARI_LAST_FALLBACK,
  HARI_PROFILE,
  HARI_STORIES,
  HARI_STORY_DETAIL,
  HARI_TUNING,
  HARI_UNLOCK_LABEL,
  HARI_HISTORY_KEY,
  type ChatLine,
  type HariStoryId,
} from './hariData'

/**
 * About her 탭
 *   dashboard  1167:8447 — 프로필 · 기록
 *   summary    1167:8708 — 스토리 카드를 누르면. 요약 말풍선 + 해시태그
 *   history    1167:8546 — CHAT HISTORY 를 누르면. 창이 스토리 창 자리까지 넓어짐
 *   접힘       1171:11060 — 대시보드 창의 − (Summary · Chat History 에서는 − 가 대시보드로 돌아가기)
 *
 * 스토리 카드는 한 번 누르면 Summary, 같은 카드를 한 번 더 누르면 대화로 (onEnterStory 가 있을 때).
 */

type Pane = 'dashboard' | 'summary' | 'history'

type Props = {
  unlocked: HariStoryId[]
  /** 대화 화면이 있는 스토리 */
  playable: HariStoryId[]
  lastAt?: string
  portrait?: string
  onEnterStory?: (id: HariStoryId) => void
}

export function HariAbout({ unlocked, playable, lastAt, portrait, onEnterStory }: Props) {
  const [pane, setPane] = useState<Pane>('dashboard')
  const [selected, setSelected] = useState<HariStoryId>('prologue')
  const [dashFolded, setDashFolded] = useState(false)
  const [storyFolded, setStoryFolded] = useState(false)

  const story = HARI_STORIES.find((s) => s.id === selected) ?? HARI_STORIES[0]
  const detail = HARI_STORY_DETAIL[selected]
  const canPlay = (id: HariStoryId) => Boolean(onEnterStory) && playable.includes(id)
  const opened = pane !== 'dashboard'
  const openStories = HARI_STORIES.filter((s) => unlocked.includes(s.id))

  const pickStory = (id: HariStoryId) => {
    if (!unlocked.includes(id)) return
    if (pane === 'summary' && selected === id && canPlay(id)) {
      onEnterStory?.(id)
      return
    }
    setSelected(id)
    setPane('summary')
    setDashFolded(false)
  }

  /* Chat History — 스토리별 대화 기록 (열 때마다 다시 읽는다) */
  const sessionsOf = (id: HariStoryId): HistorySession[] => {
    const key = HARI_HISTORY_KEY[id]
    return key ? loadHistory(key).filter((s) => s.lines.length > 0) : []
  }
  const sessions = useMemo(
    () => (pane === 'history' ? sessionsOf(selected) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pane, selected],
  )

  const openHistory = () => {
    // 고른 스토리에 기록이 없으면, 기록이 있는 가장 최근 스토리로
    if (!sessionsOf(selected).length) {
      const withLog = [...openStories].reverse().find((s) => sessionsOf(s.id).length)
      if (withLog) setSelected(withLog.id)
    }
    setPane('history')
    setDashFolded(false)
  }

  /* 대시보드 창 − : 기본 화면에서는 접기/펼치기, Summary · Chat History 에서는 대시보드로 */
  const onDashMinus = () => {
    if (pane === 'dashboard') setDashFolded((f) => !f)
    else setPane('dashboard')
  }

  const nodeId = pane === 'summary' ? '1167:8708' : pane === 'history' ? '1167:8546' : dashFolded ? '1171:11060' : '1167:8447'
  const head = pane === 'summary' ? 'Summary' : pane === 'history' ? 'Chat History' : 'Dashboard'
  const folded = pane === 'dashboard' && dashFolded

  return (
    <div className={`hr-about is-${pane}`} data-node-id={nodeId}>
      {/* ---- 왼쪽 기기 패널 (1167:8476 ~ 8491) ---- */}
      <div className="hr-device" aria-hidden />
      <div className="hr-device__inner" aria-hidden />

      {/* Locked 칩 — 스토리를 열어 보면 그 스토리의 키워드가 뜬다 (1167:8788) */}
      <ul className="hr-locks" aria-label={opened ? '키워드' : '잠긴 항목'}>
        {[0, 1, 2].map((i) => (
          <li key={i} className={`hr-lock hr-lock--${i + 1}`}>
            {opened ? detail.keywords[i] : 'Locked'}
          </li>
        ))}
      </ul>

      {/* 초상 — Summary · Chat History 에서는 22px 아래 (Figma 1167:8781) */}
      <div className="hr-portrait">
        <img className="hr-portrait__ring" src={portraitRing} alt="" width={259} height={259} />
        <div className={`hr-portrait__art${portrait ? '' : ' is-placeholder'}`}>
          {portrait && <img src={portrait} alt="반하리" />}
        </div>
      </div>

      <button
        type="button"
        className="hr-unlock"
        onClick={() => onEnterStory?.('2020')}
        disabled={!canPlay('2020')}
        title={canPlay('2020') ? '2020 · 독기 충만 연습생 대화 시작' : '준비 중'}
      >
        {HARI_UNLOCK_LABEL}
      </button>

      <button
        type="button"
        className={`hr-history${pane === 'history' ? ' is-active' : ''}`}
        onClick={openHistory}
        aria-pressed={pane === 'history'}
      >
        chat history
      </button>

      <section className="hr-tuning" aria-label="접속 정보">
        <p className="hr-tuning__title">· · · now tuning · · · {HARI_TUNING.year} · · ·</p>
        <div className="hr-tuning__keys">
          <p>DESTINATION ──</p>
          <p>{'YEAR ───────── '}</p>
          <p>STATUS ───────</p>
        </div>
        <div className="hr-tuning__values">
          <p>{HARI_TUNING.destination}</p>
          <p>{`  ${HARI_TUNING.era}`}</p>
          <p>{`  ${HARI_TUNING.status}`}</p>
        </div>
      </section>

      {/* ---- 가운데 창 (대시보드 / Summary / Chat History) ---- */}
      <div
        className={`hr-window hr-window--dash${pane === 'history' ? ' is-wide' : ''}${folded ? ' is-folded' : ''}`}
        aria-hidden
      />
      {!folded &&
        (pane === 'history' ? (
          /* 넓은 창에서는 SVG 를 늘리면 비율 때문에 가운데만 그려져서 1px 선으로 */
          <div className="hr-dash__line is-wide" aria-hidden />
        ) : (
          <img className="hr-dash__line" src={dashLine} alt="" width={718} height={1} />
        ))}
      <h2 className={`hr-head hr-head--dash${pane === 'history' ? ' is-history' : ''}`}>{head}</h2>
      <button
        type="button"
        className={`hr-minus hr-minus--dash${pane === 'history' ? ' is-wide' : ''}`}
        onClick={onDashMinus}
        aria-label={pane === 'dashboard' ? (folded ? '대시보드 펼치기' : '대시보드 접기') : '대시보드로 돌아가기'}
        aria-expanded={pane === 'dashboard' ? !folded : undefined}
      >
        <img src={minusIcon} alt="" width={34} height={34} />
      </button>

      {pane === 'dashboard' && !folded && (
        <>
          {/* 1167:8452 — 프로필 */}
          <dl className="hr-card hr-card--profile">
            <dt className="hr-label" style={{ top: 35 }}>
              work
            </dt>
            <dd className="hr-chip hr-chip--pink hr-chip--wide" style={{ top: 35 }}>
              {HARI_PROFILE.work}
            </dd>
            <dt className="hr-label" style={{ top: 110 }}>
              Feeling
            </dt>
            <dd className="hr-chip hr-chip--pink" style={{ top: 110 }}>
              {HARI_PROFILE.feeling}
            </dd>
            <dt className="hr-label" style={{ top: 183 }}>
              Relation
            </dt>
            <dd className={`hr-chip hr-chip--${HARI_PROFILE.relationTone} hr-chip--wide`} style={{ top: 183 }}>
              {HARI_PROFILE.relation}
            </dd>
          </dl>

          {/* 1167:8469 — 나눈 이야기 · 마지막 접속 */}
          <dl className="hr-card hr-card--record">
            <dt className="hr-label" style={{ top: 40 }}>
              our story
            </dt>
            <dd className="hr-record" style={{ top: 44 }}>
              {story.label} · {story.title}
            </dd>
            <dt className="hr-label" style={{ top: 113 }}>
              last shegnal
            </dt>
            <dd className="hr-record" style={{ top: 121 }}>
              {lastAt || HARI_LAST_FALLBACK}
            </dd>
          </dl>
        </>
      )}

      {pane === 'summary' && (
        <>
          {/* 1167:8721 — 요약 카드 */}
          <section className="hr-talk hr-talk--summary" aria-label={`${story.label} 요약`}>
            <h3 className="hr-talk__title">{detail.heading}</h3>
            <ol className="hr-talk__lines">
              {detail.summary.map((text, i) => (
                <ChatRow key={i} line={{ from: 'hari', text }} avatar={i === 0} portrait={portrait} />
              ))}
            </ol>
          </section>
          {/* 1167:8714 — 해시태그 */}
          <ul className="hr-tags" aria-label="해시태그">
            {detail.hashtags.map((t, i) => (
              <li key={i} className="hr-tag">
                {t}
              </li>
            ))}
          </ul>
        </>
      )}

      {pane === 'history' && (
        <>
          {/* 1169:9496 — 스토리 고르기 (열린 스토리만) */}
          <ol className="hr-picks" aria-label="대화 기록 스토리">
            {openStories.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`hr-pick${selected === s.id ? ' is-selected' : ''}${sessionsOf(s.id).length ? '' : ' is-empty'}`}
                  onClick={() => setSelected(s.id)}
                  aria-pressed={selected === s.id}
                  title={sessionsOf(s.id).length ? undefined : '아직 나눈 대화가 없어요'}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
          {/* 1167:8570 — 대화 기록 */}
          <section className="hr-talk hr-talk--history" aria-label={`${story.label} 대화 기록`}>
            <h3 className="hr-talk__title">{detail.heading}</h3>
            {sessions.length ? (
              <div className="hr-talk__scroll" role="log" aria-label="지난 대화" tabIndex={0}>
                {sessions.map((session, si) => (
                  <section key={session.id} className="hr-session">
                    <p className="hr-session__date">
                      {session.at} · {si + 1}번째 접속
                    </p>
                    <ol className="hr-talk__lines">
                      {session.lines.map((l, i) => {
                        const line: ChatLine = { from: l.from === 'her' ? 'hari' : 'user', text: l.text }
                        const avatar = line.from === 'hari' && (i === 0 || session.lines[i - 1].from !== 'her')
                        return <ChatRow key={i} line={line} avatar={avatar} portrait={portrait} />
                      })}
                    </ol>
                  </section>
                ))}
              </div>
            ) : (
              <p className="hr-talk__empty">
                아직 나눈 대화가 없어요.
                <br />
                {canPlay(selected) ? `스토리 창에서 「${story.title}」을 두 번 누르면 대화를 시작해요.` : '이 스토리는 준비 중이에요.'}
              </p>
            )}
          </section>
        </>
      )}

      {/* ---- 오른쪽 스토리 창 (Chat History 에서는 가운데 창이 덮음) ---- */}
      {pane !== 'history' && (
        <>
          <div className={`hr-window hr-window--story${storyFolded ? ' is-folded' : ''}`} aria-hidden />
          {!storyFolded && <img className="hr-story__line" src={storyLine} alt="" width={420} height={2} />}
          <h2 className="hr-head hr-head--story">story</h2>
          <button
            type="button"
            className="hr-minus hr-minus--story"
            onClick={() => setStoryFolded((f) => !f)}
            aria-label={storyFolded ? '스토리 펼치기' : '스토리 접기'}
            aria-expanded={!storyFolded}
          >
            <img src={minusIcon} alt="" width={34} height={34} />
          </button>

          {!storyFolded && (
            <ol className="hr-stories" aria-label="스토리">
              {HARI_STORIES.map((s) => {
                const open = unlocked.includes(s.id)
                const current = pane === 'summary' && selected === s.id
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`hr-story${open ? '' : ' is-locked'}${current ? ' is-selected' : ''}`}
                      onClick={() => pickStory(s.id)}
                      disabled={!open}
                      aria-pressed={open ? current : undefined}
                      title={!open ? '잠김' : current && canPlay(s.id) ? '한 번 더 누르면 대화를 시작해요' : undefined}
                    >
                      <span className="hr-story__label">{s.label}</span>
                      <span className="hr-story__title">{s.title}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </>
      )}
    </div>
  )
}

/* 말풍선 한 줄 — 하리(왼쪽 말풍선) / 사용자(오른쪽 회색 글자) */
function ChatRow({ line, avatar, portrait }: { line: ChatLine; avatar: boolean; portrait?: string }) {
  if (line.from === 'user') return <li className="hr-line hr-line--user">{line.text}</li>
  return (
    <li className="hr-line hr-line--hari">
      {avatar && (
        <span className={`hr-avatar${portrait ? '' : ' is-placeholder'}`} aria-hidden>
          {portrait && <img src={portrait} alt="" />}
        </span>
      )}
      <span className="hr-bubble">{line.text}</span>
    </li>
  )
}
