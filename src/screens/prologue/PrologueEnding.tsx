import { ChapterBadge, NoticeFrame } from './PrologueParts';
import { HerFigure, ParlorBackdrop, ParlorChrome } from './ParlorParts';
import { ENDING } from './chapter0Script';

/**
 * Figma 856:537 — 0. 18
 *
 * 응접실 화면 위에 세피아 wash 를 덮고 종료 카드를 띄운다.
 * 배경이 그대로 비치는 게 핵심이라 별도 배경을 쓰지 않는다.
 */

type Props = {
  onContinue: () => void;
  onExit: () => void;
};

export default function PrologueEnding({ onContinue, onExit }: Props) {
  return (
    <div className="pr-screen pr-ending" data-node-id="856:537">
      <ParlorBackdrop />
      <HerFigure variant="portrait" />
      <ParlorChrome />

      {/* 856:554 — 세피아 wash */}
      <div className="pr-ending__wash" data-node-id="856:554" />

      {/* 856:555 — CONNECTING TO THE PAST */}
      <p className="pr-ending__pill pr-ending__reveal" data-node-id="856:555">
        {ENDING.pill}
      </p>

      {/* 856:560 — 장식 배너 */}
      <ChapterBadge
        className="pr-ending__badge pr-ending__reveal"
        label={ENDING.chapter}
        width={704.992}
        style={{ animationDelay: '150ms' }}
      />

      {/* 856:557 / 558 — 액자 */}
      <NoticeFrame
        className="pr-ending__frame pr-ending__reveal"
        style={{ animationDelay: '380ms' }}
      />

      <p
        className="pr-ending__line pr-ending__line--1 pr-ending__reveal"
        style={{ animationDelay: '620ms' }}
        data-node-id="856:568"
      >
        {ENDING.lines[0]}
      </p>
      <p
        className="pr-ending__line pr-ending__line--2 pr-ending__reveal"
        style={{ animationDelay: '820ms' }}
        data-node-id="856:567"
      >
        {ENDING.lines[1]}
      </p>

      {/* 856:570 / 573 */}
      <button
        type="button"
        className="pr-btn pr-ending__btn pr-ending__btn--primary pr-ending__reveal"
        style={{ animationDelay: '1000ms' }}
        onClick={onContinue}
      >
        {ENDING.primary}
      </button>
      <button
        type="button"
        className="pr-btn pr-ending__btn pr-ending__btn--secondary pr-ending__reveal"
        style={{ animationDelay: '1060ms' }}
        onClick={onExit}
      >
        {ENDING.secondary}
      </button>
    </div>
  );
}
