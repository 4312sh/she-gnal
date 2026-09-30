import { useCallback, useState } from 'react';

import PrologueArrival from './PrologueArrival';
import PrologueChat from './PrologueChat';
import PrologueEnding from './PrologueEnding';
import PrologueOpening from './PrologueOpening';
import PrologueQuote from './PrologueQuote';
import PrologueTitleCard from './PrologueTitleCard';
import './prologue.css';
import './chapter0.css';

/**
 * Chapter 0. Prologue — 오프닝부터 종료 카드까지
 *
 *   opening   856:68    튜닝 로그              자동
 *     ↓ ascii
 *   quote     856:71    인용구                 자동
 *     ↓ crt
 *   title     856:76    챕터 타이틀 카드        자동
 *     ↓ fade
 *   arrival   856:94→797  아뜰리에 앞 · 들어간다  클릭
 *     ↓ crt              문을 열고 들어간다
 *   chat      856:178 → 575 → 219 → 484 → 511   응접실 채팅
 *     ↓ fade
 *   ending    856:537   프롤로그 종료           이어서 진행 / 나가기
 *
 * 대사·친밀도 규칙은 `chapter0Script.ts` 에 있고,
 * 그 내용은 나혜석_챕터0_프롤로그.md 를 그대로 옮긴 것이다.
 */

export type PrologueStep =
  | 'opening'
  | 'quote'
  | 'title'
  | 'arrival'
  | 'chat'
  | 'ending';

export const STEP_TRANSITION: Record<
  PrologueStep,
  'ascii' | 'crt' | 'fade'
> = {
  opening: 'fade',
  quote: 'ascii',
  title: 'crt',
  arrival: 'fade',
  chat: 'crt',
  ending: 'fade',
};

const ORDER: PrologueStep[] = [
  'opening',
  'quote',
  'title',
  'arrival',
  'chat',
  'ending',
];

type Props = {
  /** 챕터 1 로 넘어갈 때 */
  onComplete: () => void;
  /** 나가기 — 메인 대시보드로 */
  onExit: () => void;
  /** 개발용 진입 지점 */
  startAt?: PrologueStep;
};

export default function PrologueFlow({
  onComplete,
  onExit,
  startAt = 'opening',
}: Props) {
  const [step, setStep] = useState<PrologueStep>(startAt);

  const next = useCallback(() => {
    setStep((cur) => {
      const i = ORDER.indexOf(cur);
      return ORDER[Math.min(i + 1, ORDER.length - 1)];
    });
  }, []);

  const handleEnterAtelier = useCallback(() => {
    try {
      const raw = window.localStorage.getItem('she-gnal:player');
      const player = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(
        'she-gnal:player',
        JSON.stringify({ ...player, prologueEntered: true }),
      );
    } catch {
      // 저장 실패는 진행을 막지 않는다 (전시용)
    }
    next();
  }, [next]);

  switch (step) {
    case 'opening':
      return <PrologueOpening onDone={next} />;
    case 'quote':
      return <PrologueQuote onDone={next} />;
    case 'title':
      return <PrologueTitleCard onDone={next} />;
    case 'arrival':
      return <PrologueArrival onEnter={handleEnterAtelier} />;
    case 'chat':
      return <PrologueChat onDone={() => next()} />;
    case 'ending':
      return <PrologueEnding onContinue={onComplete} onExit={onExit} />;
  }
}
