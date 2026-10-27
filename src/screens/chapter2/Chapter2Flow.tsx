import { useCallback, useState } from 'react';

import '../prologue/prologue.css';
import '../prologue/chapter0.css';
import '../chapter1/chapter1.css';
import './chapter2.css';
import { ChapterEntryScreen, TuningScreen } from '../chapter/ChapterParts';
import { Ch2Backdrop } from './Ch2Scene';
import Chapter2Chat, { type Ch2Start } from './Chapter2Chat';
import { CH2_TUNING_LINES, type Ch1Memory } from './chapter2Script';
import type { Chapter2Save } from '../../game/types';

/**
 * Chapter 2 · 네 가지 조건 — 접속부터 채팅까지
 *
 *   tuning   935:5569   튜닝 로그
 *   title    1200:13469 진입 — 연도 배너 + 제목 바
 *   scene    930:5328 → 930:5363 → 935:5523   셋방 화실 (나가기는 935:5598)
 */

export type Ch2Step = 'tuning' | 'title' | 'scene';

type Props = {
  ch1: Ch1Memory;
  save?: Chapter2Save;
  onSave: (next: Chapter2Save) => void;
  onExit: () => void;
  onMain: () => void;
  startAt?: Ch2Step;
  sceneAt?: Ch2Start;
};

export default function Chapter2Flow({ ch1, save, onSave, onExit, onMain, startAt = 'tuning', sceneAt }: Props) {
  const [step, setStep] = useState<Ch2Step>(startAt);
  const toTitle = useCallback(() => setStep('title'), []);
  const toScene = useCallback(() => setStep('scene'), []);

  switch (step) {
    case 'tuning':
      return <TuningScreen lines={CH2_TUNING_LINES} nodeId="935:5569" onDone={toTitle} />;
    case 'title':
      return (
        <ChapterEntryScreen
          year="1920"
          title="네 가지 조건"
          nodeId="1200:13469"
          backdrop={<Ch2Backdrop />}
          onDone={toScene}
        />
      );
    case 'scene':
      return <Chapter2Chat ch1={ch1} save={save} onSave={onSave} onExit={onExit} onMain={onMain} startAt={sceneAt} />;
  }
}
