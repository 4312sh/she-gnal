import { useState } from 'react'

import minusIcon from '../../assets/hari/minus.svg'
import heartIcon from '../../assets/hari/heart.svg'
import { SNS_POST, SNS_PROFILES, type SnsProfile } from './hariData'
import type { HariArt } from './HariCharacterScreen'

/**
 * SNS 탭
 *   list  1167:8614 — 프로필 카드 3장 (반하리 · HARI · ㅎㄹ)
 *   post  1167:8663 — 반하리 카드를 누르면. 왼쪽 전신 + 말풍선, 오른쪽 게시물 창
 *
 * 게시물 화면이 있는 건 지금 반하리 계정뿐 (Figma 에서 반하리 카드만 링크).
 * 나머지 카드는 눌리지 않는다. 게시물 창의 − 는 카드 목록으로.
 */

type Props = { art: HariArt }

export function HariSns({ art }: Props) {
  const [view, setView] = useState<'list' | 'post'>('list')

  if (view === 'post') {
    return (
      <div className="hr-sns is-post" data-node-id="1167:8663">
        {/* 1169:9563 — 전신 (일러스트 자리) */}
        {art.snsFigure && <img className="hr-sns__figure" src={art.snsFigure} alt="반하리" />}
        {/* 1169:9565 — 말풍선 */}
        <p className="hr-sns__speech">{SNS_POST.speech}</p>

        {/* 1167:8669 — 게시물 창 */}
        <div className="hr-sns__window" aria-hidden />
        <div className="hr-sns__line" aria-hidden />
        <h2 className="hr-head hr-head--sns">{SNS_POST.year}</h2>
        <button
          type="button"
          className="hr-minus hr-minus--sns"
          onClick={() => setView('list')}
          aria-label="프로필 목록으로"
        >
          <img src={minusIcon} alt="" width={34} height={34} />
        </button>

        {/* 1167:8689 — 게시물 */}
        <article className="hr-post">
          <p className="hr-post__handle">{SNS_POST.handle}</p>
          <p className="hr-post__meta">{SNS_POST.meta}</p>
          <div className="hr-post__photo" aria-label="게시물 사진 (준비 중)" />
        </article>

        {/* 1167:8674 — 좋아요 · 글 · 해시태그 */}
        <aside className="hr-post-side">
          <div className="hr-post-side__body">
            <div className="hr-post-side__text">
              <p className="hr-post-side__likes">
                <img src={heartIcon} alt="" width={40.53} height={35} />
                {SNS_POST.likes}
              </p>
              <p className="hr-post-side__caption">
                {SNS_POST.body.map((l, i) => (
                  <span key={i}>{l}</span>
                ))}
              </p>
            </div>
            <ul className="hr-post-side__tags">
              {SNS_POST.hashtags.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    )
  }

  return (
    <div className="hr-sns is-list" data-node-id="1167:8614">
      <ul className="hr-profiles" aria-label="SNS 계정">
        {SNS_PROFILES.map((p, i) => (
          <li key={p.id} className={`hr-profile hr-profile--${i + 1}`}>
            {p.hasPost ? (
              <button type="button" className="hr-profile__card" onClick={() => setView('post')}>
                <ProfileBody profile={p} image={art.snsPortraits?.[p.id]} />
              </button>
            ) : (
              <div className="hr-profile__card" aria-disabled>
                <ProfileBody profile={p} image={art.snsPortraits?.[p.id]} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProfileBody({ profile, image }: { profile: SnsProfile; image?: string }) {
  return (
    <>
      <span
        className={`hr-profile__circle${image ? '' : ' is-placeholder'}`}
        style={{ background: profile.circle }}
        aria-hidden
      >
        {image && <img src={image} alt="" />}
      </span>
      <span className={`hr-profile__name${profile.dot ? ' has-dot' : ''}`}>{profile.name}</span>
      {profile.dot && <span className="hr-profile__dot" style={{ background: profile.dot }} aria-hidden />}
      <span className="hr-profile__edit">Edit Profile</span>
    </>
  )
}
