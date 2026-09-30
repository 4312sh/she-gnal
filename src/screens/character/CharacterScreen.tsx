import { useMemo, useState } from 'react';

import parlorInterior from '../../assets/prologue/parlor-interior.webp';
import herPortrait from '../../assets/prologue/her-portrait.png';
import portraitFrame from '../../assets/character/portrait-frame.svg';
import dashboardFrame from '../../assets/character/dashboard-frame.svg';
import { ChapterBadge } from '../prologue/PrologueParts';
import '../prologue/prologue.css';
import './character.css';
import type { Chapter1Save } from '../../game/types';
import {
  RECORD_SLOTS,
  STORY_ENTRIES,
  STORY_ROWS,
  TABS,
  TUNING_BY_STORY,
  TUNING_DEFAULT,
  profileFrom,
  type StoryId,
} from './characterData';

/**
 * 캐릭터 · About her — Figma 923:4434 (스토리 선택) / 936:6268 (기본)
 *
 * 두 프레임은 가운데 대시보드만 다르다.
 *   - 기본: 생업 · 혼인 · 관계 · 나눈 이야기 · 마지막 접속 (936:6284)
 *   - 스토리 선택: 시 한 편 + 버튼 세 개 (923:4563 ~ 4572)
 *
 * 채팅 진입은 초상 카드(좌상단)다. 잠겨 있을 때 "1914 대화 시 해금" 이라고 쓰인 그 칸.
 * 스토리 목록에서 도쿄 유학길을 두 번 눌러도 들어간다.
 *
 * 초상 두 장(잠김 / 해금)은 Figma 에서 내보내 `src/assets/character/` 에 넣으면 바뀐다.
 * 없으면 프롤로그 인물 그림을 잘라 자리를 채운다.
 */

const optional = import.meta.glob('../../assets/character/*.{png,webp,jpg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;
const pick = (f: string) => Object.entries(optional).find(([p]) => p.endsWith(`/${f}`))?.[1];
const portraitOpen = pick('portrait-1914.png');
const portraitLocked = pick('portrait-1914-locked.png');

type Props = {
  ch1?: Chapter1Save;
  lastPlayedAt?: string;
  /** 도쿄 유학길 채팅으로 */
  onEnterChapter1: () => void;
  /** 우상단 네모 — 메인 대시보드로 */
  onBack: () => void;
};

export function CharacterScreen({ ch1, lastPlayedAt, onEnterChapter1, onBack }: Props) {
  const [selected, setSelected] = useState<StoryId | null>(null);
  const [detail, setDetail] = useState<number | null>(null);

  const profile = useMemo(() => profileFrom(ch1, lastPlayedAt), [ch1, lastPlayedAt]);
  const entry = selected ? STORY_ENTRIES[selected] : undefined;
  const tuning = (selected && TUNING_BY_STORY[selected]) || TUNING_DEFAULT;
  const unlocked = Boolean(ch1?.done);

  const selectRow = (id: StoryId) => {
    if (!STORY_ENTRIES[id]) return;
    if (selected === id && STORY_ROWS.find((r) => r.id === id)?.playable) {
      onEnterChapter1();
      return;
    }
    setSelected(id);
    setDetail(null);
  };

  return (
    <div className="pr-screen ch-screen" data-node-id={entry ? '923:4434' : '936:6268'}>
      {/* 923:4435 ~ 4437 — 배경 */}
      <div className="ch-bg" aria-hidden>
        <img src={parlorInterior} alt="" />
      </div>
      <div className="ch-desaturate" aria-hidden />
      <div className="ch-vignette" aria-hidden />

      {/* 923:4438 — 배너 */}
      <ChapterBadge className="ch-banner" label="Character" width={390} left={112} top={31} />

      {/* 923:4449 — 상단 손잡이 */}
      <div className="ch-notch" aria-hidden />

      {/* 923:4546 — 탭 */}
      <nav className="ch-tabs" aria-label="캐릭터 메뉴">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            className={`ch-tab${i === 0 ? ' is-active' : ''}`}
            aria-current={i === 0 ? 'page' : undefined}
            disabled={i !== 0}
            title={i === 0 ? undefined : '준비 중'}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* 923:4448 — 우상단 네모: 나가기 */}
      <button type="button" className="ch-corner" onClick={onBack} aria-label="메인 대시보드로" />

      {/* 923:4556 — 초상 카드 (채팅 진입) */}
      <button
        type="button"
        className={`ch-portrait${unlocked ? ' is-open' : ''}`}
        onClick={onEnterChapter1}
        aria-label="도쿄 유학길 대화 시작"
      >
        <img className="ch-portrait__frame" src={portraitFrame} alt="" />
        <span className={`ch-portrait__art${unlocked ? ' is-open' : ''}`}>
          {unlocked && portraitOpen ? (
            <img src={portraitOpen} alt="" />
          ) : !unlocked && portraitLocked ? (
            <img src={portraitLocked} alt="" />
          ) : (
            <img className="ch-portrait__fallback" src={herPortrait} alt="" />
          )}
        </span>
        <span className="ch-portrait__caption">
          <span className="ch-portrait__caption-text">{profile.caption}</span>
          <span className="ch-portrait__caption-hover">1914 · 도쿄 유학길 접속</span>
        </span>
      </button>

      {/* 923:4526 — 채팅 기록 보기 */}
      <section className="ch-records" aria-label="채팅 기록">
        <p className="ch-records__title">채팅 기록 보기</p>
        <div className="ch-records__slots">
          {RECORD_SLOTS.map((s, i) => (
            <span key={i} className="ch-records__slot">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* 923:4542 ~ 4545 — 접속 정보 */}
      <section className="ch-tuning" aria-label="접속 정보">
        <p className="ch-tuning__title">· · · now tuning · · · {tuning.year} · · ·</p>
        <div className="ch-tuning__keys">
          <p>DESTINATION ──</p>
          <p>{'YEAR ───────── '}</p>
          <p>STATUS ───────</p>
        </div>
        <div className="ch-tuning__values">
          <p>{tuning.destination}</p>
          <p>{tuning.era}</p>
          <p>接續 / connected</p>
        </div>
      </section>

      {/* 923:4518 / 4521 — 섹션 헤더 */}
      <div className="ch-head ch-head--dash">대시보드</div>
      <button
        type="button"
        className="ch-square ch-square--dash"
        onClick={() => {
          setSelected(null);
          setDetail(null);
        }}
        aria-label="기본 대시보드로"
      />
      <div className="ch-head ch-head--story">스토리</div>
      <span className="ch-square ch-square--story" aria-hidden />

      {/* 923:4450 / 936:6284 — 대시보드 */}
      <div className={`ch-dash${entry ? ' ch-dash--story' : ''}`} aria-hidden />
      <img className="ch-dash__frame" src={dashboardFrame} alt="" />

      {entry ? (
        <>
          <p className="ch-entry__header">{entry.header}</p>
          <div className="ch-entry__poem">
            <p>{(detail === null ? entry.poem : entry.buttons[detail].body).join('\n')}</p>
          </div>
          {entry.buttons.map((b, i) => (
            <button
              key={b.label}
              type="button"
              className={`ch-entry__btn ch-entry__btn--${i + 1}${detail === i ? ' is-active' : ''}`}
              onClick={() => setDetail((d) => (d === i ? null : i))}
              aria-pressed={detail === i}
            >
              {b.label}
            </button>
          ))}
        </>
      ) : (
        <dl className="ch-profile">
          <dt className="ch-profile__label ch-profile__label--job">생업</dt>
          <dd className="ch-profile__value ch-profile__value--job">{profile.job}</dd>
          <dt className="ch-profile__label ch-profile__label--marriage">혼인</dt>
          <dd className="ch-profile__value ch-profile__value--marriage">{profile.marriage}</dd>
          <dt className="ch-profile__label ch-profile__label--relation">관계</dt>
          <dd className="ch-profile__value ch-profile__value--relation">{profile.relation}</dd>
          <dt className="ch-profile__label ch-profile__label--story">나눈 이야기</dt>
          <dd className="ch-profile__mono ch-profile__mono--story">{profile.story}</dd>
          <dt className="ch-profile__label ch-profile__label--last">마지막 접속</dt>
          <dd className="ch-profile__mono ch-profile__mono--last">{profile.lastAt}</dd>
        </dl>
      )}

      {/* 923:4453 — 스토리 목록 */}
      <ol className="ch-stories" aria-label="스토리">
        {STORY_ROWS.map((r) => {
          const selectable = Boolean(STORY_ENTRIES[r.id]);
          const cls = [
            'ch-story',
            r.locked && 'is-locked',
            r.tall && 'is-tall',
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
                onDoubleClick={() => r.playable && onEnterChapter1()}
                disabled={!selectable}
                aria-pressed={selected === r.id}
                title={r.playable ? (selected === r.id ? '한 번 더 누르면 대화를 시작해요' : undefined) : '준비 중'}
              >
                <span className="ch-story__year">{r.year}</span>
                <span className="ch-story__title">{r.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
