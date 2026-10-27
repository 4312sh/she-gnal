import { useEffect, useRef, useState } from 'react'
import backdrop from '../../assets/dashboard/main-backdrop.svg'
import sphere from '../../assets/name/sphere.svg'
import { GyroSymbol } from '../../components/GyroSymbol'
import { ERAS, type Era } from '../../game/eras'
import type { Player } from '../../game/types'
import { isSoundOn, playSfx, setSoundOn } from '../../game/sfx'
import './Dashboard.css'
import './MainDashboard.css'

type Props = {
  player: Partial<Player>
  onConnect: () => void
  onGameRule?: () => void
  /** VIEW CHARACTOR — View charactor 화면 (가장 최근 캐릭터 기준으로 열린다) */
  onViewCharacter?: (eraId: Era['id']) => void
  /** SETTINGS — 유저 이름 바꾸기 */
  onRename?: (name: string) => void
}

const NAME_MAX = 16

const TOTAL_CHAPTERS = 12
const BAR = 20

/** Figma: "main dashboard * 적용 시 모습" (1343:36835, 이전 743:21689) */
export function MainDashboard({ player, onConnect, onGameRule, onViewCharacter, onRename }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  /** 버튼 위에 올라갈 때 한 번만 틱 */
  const hovered = useRef<Element | null>(null)
  const openSettings = () => {
    playSfx('open')
    setSettingsOpen(true)
  }
  const closeSettings = () => {
    playSfx('close')
    setSettingsOpen(false)
  }
  const done = player.completedChapters?.length ?? 0
  const pct = Math.round((done / TOTAL_CHAPTERS) * 100)
  const filled = Math.round((pct / 100) * BAR)
  const bar = '█'.repeat(filled) + '░'.repeat(BAR - filled)

  const last = player.lastPlayed
  const lastEra = last && ERAS.find((e) => e.id === last.eraId)
  const characterEra: Era['id'] = lastEra?.id ?? 'past'

  return (
    <div
      className="dash main-dash"
      data-node-id="1343:36835"
      onPointerOver={(e) => {
        const btn = (e.target as Element).closest('button:not(:disabled)')
        if (btn && btn !== hovered.current) playSfx('hover')
        hovered.current = btn
      }}
    >
      <img className="art art--bleed" src={backdrop} alt="" />

      {/* 가운데 심볼 — 타이틀과 같은 자이로 모션. Figma 에서는 타이틀 심볼(950.748×577)을
          0.3917 배로 줄인 372.4×226 (774, 30) */}
      <GyroSymbol className="main-dash__gyro" locked={false} />

      {/* top bar — Figma Component 21 / 22 / 23 */}
      <div className="main-dash__pill main-dash__user" style={{ left: 80, top: 67 }}>
        <span>user name</span>
        <span className="main-dash__name">/{player.name || 'unknown'}/</span>
      </div>
      {/* 오른쪽 위 — 오른쪽 끝을 VIEW CHARACTOR · 캐릭터 상자와 같은 x 1840 에 맞춘다 */}
      <div className="main-dash__top-right">
        <button
          type="button"
          className="main-dash__pill"
          onClick={() => {
            playSfx('click')
            onGameRule?.()
          }}
        >
          game rule
        </button>
        <button type="button" className="main-dash__pill" onClick={openSettings}>
          settings
        </button>
      </div>

      {/* status — Figma Component 25 / 20 + Rectangle 10 / 12 */}
      <span className="main-dash__tag" style={{ left: 80, top: 246, height: 48 }}>
        total shegnal
      </span>
      <div className="main-dash__box" style={{ left: 281, top: 245, width: 370, height: 60 }} />
      <p className="main-dash__value" style={{ left: 307, top: 260 }}>
        {`${pct}%   [${bar}]`}
      </p>

      <span className="main-dash__tag" style={{ left: 80, top: 347, height: 48 }}>
        last shegnal
      </span>
      <div className="main-dash__box" style={{ left: 281, top: 347, width: 370, height: 120 }} />
      <p className="main-dash__value" style={{ left: 307, top: 362 }}>
        {last && lastEra
          ? `${last.year ?? lastEra.anchorYear} · ${lastEra.city} / \n${lastEra.character} · CHAPTER ${last.chapter} + \n${last.at}`
          : '---- · NO SHEGNAL YET\n접속 기록 없음'}
      </p>

      {/* view charactor — Figma Component 26 + Rectangle 13 + sphere (_레이어_ 1343:37276) */}
      <button
        type="button"
        className="main-dash__tag main-dash__tag--button"
        style={{ right: 80, top: 246, height: 48 }}
        onClick={() => {
          playSfx('click')
          onViewCharacter?.(characterEra)
        }}
      >
        view charactor
      </button>
      <button
        type="button"
        className="main-dash__box main-dash__character"
        style={{ right: 80, top: 319, width: 273, height: 221 }}
        onClick={() => {
          playSfx('click')
          onViewCharacter?.(characterEra)
        }}
        aria-label="캐릭터 보기"
      >
        <img src={sphere} alt="" draggable={false} />
      </button>

      {/* the dome is the entry point */}
      <button
        type="button"
        className="main-dash__dome"
        onClick={() => {
          playSfx('connect')
          onConnect()
        }}
        aria-label="Connect to her era — 시간대 진입 설정"
      />

      {settingsOpen && (
        <SettingsModal
          name={player.name ?? ''}
          onSave={(name) => {
            playSfx('confirm')
            onRename?.(name)
            setSettingsOpen(false)
          }}
          onClose={closeSettings}
        />
      )}
    </div>
  )
}

/** SETTINGS — 유저 이름 바꾸기. Enter 저장 · Esc 닫기 */
function SettingsModal({ name, onSave, onClose }: { name: string; onSave: (name: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(name)
  const [sound, setSound] = useState(isSoundOn)
  const input = useRef<HTMLInputElement>(null)
  const valid = draft.trim().length > 0
  const changed = draft.trim() !== name.trim()
  const toggleSound = (on: boolean) => {
    setSoundOn(on)
    setSound(on)
    if (on) playSfx('click')
  }

  useEffect(() => {
    input.current?.focus({ preventScroll: true })
    input.current?.select()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="dash-settings" role="dialog" aria-modal="true" aria-label="settings" onClick={onClose}>
      <form
        className="dash-settings__panel"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onSave(draft.trim())
        }}
      >
        <p className="dash-settings__title">SETTINGS</p>
        <label className="dash-settings__row">
          <span className="dash-settings__label">USER NAME</span>
          <input
            ref={input}
            className="dash-settings__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={NAME_MAX}
            placeholder="name"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <p className="dash-settings__hint">
          {draft.length} / {NAME_MAX}
        </p>
        <div className="dash-settings__row">
          <span className="dash-settings__label">SOUND</span>
          <div className="dash-settings__toggle" role="radiogroup" aria-label="효과음">
            {([true, false] as const).map((on) => (
              <button
                key={String(on)}
                type="button"
                role="radio"
                aria-checked={sound === on}
                className={`dash-settings__opt${sound === on ? ' is-on' : ''}`}
                onClick={() => toggleSound(on)}
              >
                {on ? 'ON' : 'OFF'}
              </button>
            ))}
          </div>
        </div>
        <div className="dash-settings__actions">
          <button type="button" className="main-dash__pill dash-settings__btn" onClick={onClose}>
            cancel
          </button>
          <button
            type="submit"
            className="main-dash__pill dash-settings__btn dash-settings__btn--save"
            disabled={!valid || !changed}
          >
            save
          </button>
        </div>
      </form>
    </div>
  )
}
