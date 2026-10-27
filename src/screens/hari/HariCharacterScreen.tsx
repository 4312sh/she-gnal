import { useState } from 'react'

import { HARI_TABS, type HariStoryId, type HariTab, type SnsProfileId } from './hariData'
import { HariAbout } from './HariAbout'
import { HariSns } from './HariSns'
import { GlassIconSvg } from './HariIcons'
import waitroom from '../../assets/hari/debut-waitroom.webp'
import './hari.css'
import './hari-sns.css'


/**
 * 캐릭터 화면 — 반하리 (현재)
 *
 *   About her 탭 (HariAbout)
 *     1167:8447  대시보드 (기본)
 *     1167:8708  스토리 카드를 누르면 → Summary
 *     1167:8546  CHAT HISTORY 를 누르면 → Chat History (창이 가로로 넓어짐)
 *     1171:11060 창 머리의 − 를 누르면 → 창이 접힘 (다시 누르면 펼침)
 *   SNS 탭 (HariSns)
 *     1167:8614  프로필 카드 3장
 *     1167:8663  반하리 카드를 누르면 → 게시물
 *
 * 좌표는 Figma 1920×1080 아트보드 기준 (hari.css / hari-sns.css).
 * 일러스트(배경 · 초상 · 전신) 와 PNG 질감(상단 바 · 탭) 은 아직 없어서
 *   - 일러스트: 자리만 잡아 둠. props 로 이미지를 넘기면 바로 들어감
 *   - 상단 바 · 탭 질감: CSS 그라데이션으로 근사
 */

export type HariArt = {
  /** 배경 대기실 사진 */
  background?: string
  /** About her 원형 초상 · 대화 아바타 */
  portrait?: string
  /** SNS 프로필 원 안 그림 (반하리 · HARI · ㅎㄹ) */
  snsPortraits?: Partial<Record<SnsProfileId, string>>
  /** SNS 게시물 화면 왼쪽 전신 그림 */
  snsFigure?: string
}

type Props = {
  /** 열린 스토리. 기본값은 Figma 상태 (Prologue · 2020) */
  unlocked?: HariStoryId[]
  /** 마지막 접속 (yyyy.m.d) */
  lastAt?: string
  /** 일러스트 — 나중에 받는 그림들 */
  art?: HariArt
  /** 처음 열 탭 (개발용) */
  initialTab?: HariTab
  /** 대화 화면이 있는 스토리 — 여기 든 것만 들어갈 수 있다 (나머지는 '준비 중') */
  playable?: HariStoryId[]
  /** 스토리 대화로 */
  onEnterStory?: (id: HariStoryId) => void
  /** 우상단 X — 메인 대시보드로 */
  onBack: () => void
}

export function HariCharacterScreen({
  unlocked = ['prologue', '2020'],
  lastAt,
  art = {},
  initialTab = 'about',
  playable = [],
  onEnterStory,
  onBack,
}: Props) {
  const [tab, setTab] = useState<HariTab>(initialTab)

  return (
    <div className="hr-screen">
      {/* 1167:8448 / 8449 — 배경 사진 + 보라 블러 막 */}
      {/* 배경 — 방송국 대기실 (2669 × 1117, 왼쪽 -364: Figma 1167:8447 배경 칸). art.background 를 주면 그걸로 */}
      <div className="hr-bg" aria-hidden>
        <img src={art.background ?? waitroom} alt="" />
      </div>
      <div className="hr-veil" aria-hidden />

      {tab === 'sns' ? (
        <HariSns art={art} />
      ) : (
        <HariAbout
          unlocked={unlocked}
          playable={onEnterStory ? playable : []}
          lastAt={lastAt}
          portrait={art.portrait}
          onEnterStory={onEnterStory}
        />
      )}

      {/* 1168:9114 — 상단 바 (창들보다 위) */}
      <header className="hr-topbar">
        <div className="hr-topbar__row">
          <div className="hr-topbar__left">
            <span className="hr-badge">Charactor</span>
            <nav className="hr-tabs" aria-label="캐릭터 메뉴">
              {HARI_TABS.map((t) => {
                const active = t.id === tab
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`hr-tab${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    disabled={!t.ready}
                    title={t.ready ? undefined : '준비 중'}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                )
              })}
            </nav>
          </div>
          {/* 1167:8897 — X (판은 CSS, 모양은 인라인 SVG — HariIcons 참고) */}
          <button type="button" className="hr-close hr-glassbtn" onClick={onBack} aria-label="메인 대시보드로">
            <GlassIconSvg icon="close" />
          </button>
        </div>
      </header>
    </div>
  )
}
