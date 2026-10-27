import { useCallback, useState } from 'react';

import { ChapterEntryScreen, TuningScreen } from '../chapter/ChapterParts';
import '../prologue/prologue.css';
import '../prologue/chapter0.css';
import './chapter1.css';
import Chapter1Chat, { type Ch1Start } from './Chapter1Chat';
import { Ch1Backdrop } from './Ch1Scene';
import { CH1_TUNING_LINES } from './chapter1Script';
import type { Chapter1Save } from '../../game/types';

/**
 * Chapter 1 · 도쿄 유학길 — 접속부터 채팅까지
 *
 *   tuning   934:5495   튜닝 로그             자동
 *   title    1200:13381 진입 — 연도 배너 + 제목 바  자동 (클릭하면 넘김)
 *   scene    929:5255 → 929:5290 → 930:5450   하숙방 앞 대화
 *                       나가기는 856:537 모달
 *
 * 튜닝 · 타이틀 카드는 프롤로그와 같은 부품(atelier 배경판, 배너, 액자)을 쓴다.
 */

export type Ch1Step = 'tuning' | 'title' | 'scene';

type Props = {
  playerName: string;
  save?: Chapter1Save;
  onSave: (next: Chapter1Save) => void;
  /** 나가기 (작별 인사가 끝난 뒤) */
  onExit: () => void;
  onMain: () => void;
  /** 개발용 진입 지점 */
  startAt?: Ch1Step;
  sceneAt?: Ch1Start;
};

export default function Chapter1Flow({
  playerName,
  save,
  onSave,
  onExit,
  onMain,
  startAt = 'tuning',
  sceneAt,
}: Props) {
  const [step, setStep] = useState<Ch1Step>(startAt);
  const toTitle = useCallback(() => setStep('title'), []);
  const toScene = useCallback(() => setStep('scene'), []);

  switch (step) {
    case 'tuning':
      return <TuningScreen lines={CH1_TUNING_LINES} nodeId="934:5495" onDone={toTitle} />;
    case 'title':
      return (
        <ChapterEntryScreen
          year="1914"
          title="도쿄 유학길"
          nodeId="1200:13381"
          backdrop={<Ch1Backdrop />}
          onDone={toScene}
        />
      );
    case 'scene':
      return (
        <Chapter1Chat
          playerName={playerName}
          save={save}
          onSave={onSave}
          onExit={onExit}
          onMain={onMain}
          startAt={sceneAt}
        />
      );
  }
}
