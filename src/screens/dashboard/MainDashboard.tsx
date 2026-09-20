import backdrop from '../../assets/dashboard/main-backdrop.svg'
import { ERAS } from '../../game/eras'
import type { Player } from '../../game/types'
import './Dashboard.css'
import './MainDashboard.css'

type Props = {
  player: Partial<Player>
  onConnect: () => void
  onGameRule?: () => void
}

const TOTAL_CHAPTERS = 12
const BAR = 20

/** Figma: "main dashboard" (743:21689) */
export function MainDashboard({ player, onConnect, onGameRule }: Props) {
  const done = player.completedChapters?.length ?? 0
  const pct = Math.round((done / TOTAL_CHAPTERS) * 100)
  const filled = Math.round((pct / 100) * BAR)
  const bar = '█'.repeat(filled) + '░'.repeat(BAR - filled)

  const last = player.lastPlayed
  const lastEra = last && ERAS.find((e) => e.id === last.eraId)
  const memories = player.unlockedMemories?.length ?? 0

  return (
    <div className="dash main-dash" data-node-id="743:21689">
      <>
        <img className="art art--bleed" src={backdrop} alt="" />

        {/* top bar */}
        <div className="dash-pill" style={{ left: 81, top: 67, width: 540, height: 54, gap: 88 }}>
          <span>user name</span>
          <span className="main-dash__name">{player.name || 'unknown'}</span>
        </div>
        <button
          type="button"
          className="dash-pill"
          style={{ left: 1520, top: 67, width: 151, height: 54 }}
          onClick={onGameRule}
        >
          game rule
        </button>
        <button
          type="button"
          className="dash-pill"
          style={{ left: 1699, top: 67, width: 138, height: 54 }}
          title="준비 중"
        >
          SETTINGS
        </button>

        {/* status panel */}
        <span className="dash-tag" style={{ left: 99, top: 265 }}>
          TOTAL SIGNAL
        </span>
        <p className="dash-value" style={{ left: 307, top: 269 }}>
          {`${pct}%,    `}
          <span className="small">[{bar}]</span>
        </p>
        <span className="dash-tag" style={{ left: 99, top: 339 }}>
          LAST SIGNAL
        </span>
        <p className="dash-value" style={{ left: 307, top: 343 }}>
          {last && lastEra ? (
            <>
              {`${lastEra.anchorYear} · ${lastEra.city} / \n`}
              <span className="light">{`${lastEra.character} · CHAPTER ${last.chapter} + \n`}</span>
              {last.at}
            </>
          ) : (
            <>
              {'---- · NO SIGNAL YET\n'}
              <span className="light">{'접속 기록 없음\n'}</span>
            </>
          )}
        </p>
        <span className="dash-tag" style={{ left: 1595, top: 265 }}>
          unlockedMemories
        </span>
        <p className="dash-value" style={{ left: 1525, top: 343 }}>
          {memories > 0 ? `${memories} / 24` : '????'}
        </p>

        {/* the dome is the entry point */}
        <button
          type="button"
          className="main-dash__dome"
          onClick={onConnect}
          aria-label="Connect to her era — 시간대 진입 설정"
        />
      </>
    </div>
  )
}
