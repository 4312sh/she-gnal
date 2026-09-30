import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { askHerWith, type Turn } from '../../game/her/herChat';
import {
  RE_OPEN,
  buildCh1Prompt,
  ch1Fallback,
  cleanCh1Reply,
  topicSeed,
  validateCh1Reply,
  type Ch1Context,
} from '../../game/her/chapter1Persona';
import type { Chapter1Save } from '../../game/types';
import { AdvanceLayer, ChapterBadge, NoticeFrame } from '../prologue/PrologueParts';
import { ParlorChrome, useTypewriter } from '../prologue/ParlorParts';
import { Ch1Backdrop, Ch1Figure } from './Ch1Scene';
import {
  CH1_AFTER_NARRATION,
  CH1_BADGE,
  CH1_CHOICES,
  CH1_EARLY_OPEN_PHASES,
  CH1_EXIT,
  CH1_FADE,
  CH1_FAREWELL,
  CH1_HEADER,
  CH1_NAME_ASK,
  CH1_OPENING,
  CH1_SEED_TURNS,
  CH1_TELEGRAM_NARRATION,
  CH1_TURN_ORDER,
  CH1_UNLOCK,
  INPUT_MAX,
  SUBMIT_LABEL,
  extractName,
  nameStory,
  telegramLines,
  type Ch1ChoiceId,
  type Ch1Phase,
} from './chapter1Script';

/**
 * Chapter 1 하숙방 앞 — Figma 929:5255 / 929:5290 / 930:5450 (+ 856:537 모달)
 *
 * 세 프레임이 배경 · 인물 · 상단 바를 공유하고 하단 UI 만 달라서
 * 화면을 쪼개지 않고 한 컴포넌트의 모드로 돌린다.
 *
 *   subtitle   929:5255   가운데 자막. 클릭 · 스페이스로 다음 줄
 *   chat       929:5290   채팅 로그 + 입력창 (LLM)
 *   choice     930:5450   질문 + 2지선다
 *
 * 흐름 (MD v2)
 *   opening → door · stranger · origin · manuscript · dream · resolve (LLM 6턴)
 *   → 전보 → 선택 → 반응 → 이름 나누기 → 이어지는 대화 (끝나지 않음)
 *   나가기는 어느 단계에서든 우상단 버튼 → 856:537 모달
 */

export type Ch1Start = 'opening' | 'chat' | 'choice' | 'after';

type Line = { kind: 'her' | 'narr'; text: string };
type Msg = { id: string; from: 'her' | 'you'; text: string; live?: boolean };
type Stage = 'pre' | 'nameAsk' | 'after' | 'leaving';
type Mode = 'subtitle' | 'chat' | 'choice';

type Props = {
  playerName: string;
  save?: Chapter1Save;
  onSave: (next: Chapter1Save) => void;
  onExit: () => void;
  startAt?: Ch1Start;
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default function Chapter1Chat({ playerName, save, onSave, onExit, startAt = 'opening' }: Props) {
  /* ---------------- 상태 ---------------- */

  const [mode, setMode] = useState<Mode>('subtitle');
  const [stage, setStage] = useState<Stage>('pre');
  const [queue, setQueue] = useState<Line[]>([]);
  const [qi, setQi] = useState(0);
  const [log, setLog] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [turn, setTurn] = useState(0);
  const [afterTurns, setAfterTurns] = useState(0);
  const [question, setQuestion] = useState('');
  const [exitOpen, setExitOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [debug, setDebug] = useState<{ phase: string; live: boolean | null; reason?: string }>({
    phase: 'opening',
    live: null,
  });

  /** 이 접속에서 알게 된 것 · 선택 · 이름. 저장은 onSave 로 넘긴다 */
  const progress = useRef<Chapter1Save>({
    done: save?.done ?? false,
    choice: save?.choice,
    nameShared: false,
    sharedName: undefined,
    unlocks: [...(save?.unlocks ?? [])],
    lastAt: today(),
  });
  const history = useRef<Turn[]>([...CH1_SEED_TURNS]);
  const seq = useRef(0);
  const onQueueDone = useRef<(() => void) | null>(null);
  const holdLast = useRef(false);
  const aborter = useRef<AbortController | null>(null);

  const name = progress.current.sharedName ?? (playerName.trim() || '손님');
  const ctx = useMemo<Ch1Context>(
    () => ({
      name,
      nameShared: progress.current.nameShared,
      choiceLabel: progress.current.choice ? CH1_CHOICES[progress.current.choice].label : undefined,
    }),
    // progress 는 ref 라 stage 가 바뀔 때마다 다시 읽는다
    [name, stage],
  );

  /* ---------------- 공통 도우미 ---------------- */

  const push = useCallback((from: 'her' | 'you', text: string, live?: boolean) => {
    seq.current += 1;
    setLog((l) => [...l, { id: `m${seq.current}`, from, text, live }]);
  }, []);

  const commit = useCallback(
    (patch: Partial<Chapter1Save>) => {
      progress.current = { ...progress.current, ...patch, lastAt: today() };
      onSave(progress.current);
    },
    [onSave],
  );

  const unlock = useCallback(
    (label: string) => {
      if (!progress.current.unlocks.includes(label)) {
        commit({ unlocks: [...progress.current.unlocks, label] });
      }
      setToast(label);
    },
    [commit],
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  /** 자막 대사를 차례로 보여 주고, 끝나면 done 을 부른다 */
  const play = useCallback((lines: Line[], done: () => void, opts?: { holdLast?: boolean }) => {
    onQueueDone.current = done;
    holdLast.current = Boolean(opts?.holdLast);
    setQueue(lines);
    setQi(0);
    setMode('subtitle');
  }, []);

  const current = mode === 'subtitle' ? queue[qi] : undefined;
  const typer = useTypewriter(current?.text ?? '');

  const advance = useCallback(() => {
    if (mode !== 'subtitle' || !current) return;
    if (!typer.done) {
      typer.finish();
      return;
    }
    if (current.kind === 'her') push('her', current.text);
    if (qi < queue.length - 1) {
      setQi((n) => n + 1);
      return;
    }
    const done = onQueueDone.current;
    onQueueDone.current = null;
    done?.();
  }, [mode, current, typer, push, qi, queue.length]);

  // 마지막 줄을 붙잡아 두는 경우 (전보 질문 → 선택지). 다 찍히면 바로 넘긴다
  useEffect(() => {
    if (mode !== 'subtitle' || !holdLast.current || !current) return;
    if (qi !== queue.length - 1 || !typer.done) return;
    holdLast.current = false;
    const done = onQueueDone.current;
    onQueueDone.current = null;
    done?.();
  }, [mode, qi, queue.length, typer.done, current]);

  /* ---------------- 흐름 ---------------- */

  const toChat = useCallback((nextStage: Stage) => {
    setStage(nextStage);
    setMode('chat');
  }, []);

  const startTelegram = useCallback(() => {
    const lines = telegramLines(progress.current.nameShared ? `${name} 씨` : '당신');
    play(
      [
        { kind: 'narr', text: CH1_TELEGRAM_NARRATION },
        { kind: 'her', text: lines[0] },
        { kind: 'her', text: lines[1] },
      ],
      () => {
        setQuestion(lines[1]);
        setMode('choice');
        setDebug((d) => ({ ...d, phase: 'telegram · choice' }));
      },
      { holdLast: true },
    );
  }, [play, name]);

  const startAfter = useCallback(() => {
    play([{ kind: 'narr', text: CH1_AFTER_NARRATION }], () => {
      toChat('after');
      setDebug((d) => ({ ...d, phase: 'afterglow' }));
    });
  }, [play, toChat]);

  const askName = useCallback(() => {
    push('her', CH1_NAME_ASK);
    history.current = [...history.current, { role: 'assistant', content: CH1_NAME_ASK }];
    toChat('nameAsk');
    setDebug((d) => ({ ...d, phase: 'names' }));
  }, [push, toChat]);

  const pick = useCallback(
    (id: Ch1ChoiceId) => {
      const c = CH1_CHOICES[id];
      push('her', question);
      push('you', c.label);
      history.current = [...history.current, { role: 'user', content: c.label }];
      commit({ choice: id });
      const lines: Line[] = [
        ...(c.narration ? [{ kind: 'narr' as const, text: c.narration }] : []),
        ...c.lines.map((text) => ({ kind: 'her' as const, text })),
      ];
      play(lines, () => {
        history.current = [...history.current, { role: 'assistant', content: c.lines.join(' ') }];
        unlock(CH1_UNLOCK.trait(c.trait));
        askName();
      });
      setDebug((d) => ({ ...d, phase: `reaction ${id}` }));
    },
    [push, question, commit, play, unlock, askName],
  );

  /* ---------------- 입력 ---------------- */

  const submit = useCallback(async () => {
    const text = draft.trim();
    if (!text || thinking || mode !== 'chat') return;
    setDraft('');

    // 이름 나누기 — LLM 을 부르지 않는다
    if (stage === 'nameAsk') {
      push('you', text);
      const n = extractName(text, playerName);
      history.current = [...history.current, { role: 'user', content: text }];
      commit({ nameShared: true, sharedName: n, done: true });
      const story = nameStory(n);
      play(
        story.map((t) => ({ kind: 'her' as const, text: t })),
        () => {
          history.current = [...history.current, { role: 'assistant', content: story.join(' ') }];
          unlock(CH1_UNLOCK.name);
          startAfter();
        },
      );
      return;
    }

    let phase: Ch1Phase;
    let seed: string | undefined;
    if (stage === 'after') {
      const n = afterTurns + 1;
      setAfterTurns(n);
      phase = 'afterglow';
      seed = topicSeed(n);
    } else {
      const base = CH1_TURN_ORDER[Math.min(turn, CH1_TURN_ORDER.length - 1)];
      phase = CH1_EARLY_OPEN_PHASES.includes(base) && RE_OPEN.test(text) ? 'resolveEarly' : base;
    }

    push('you', text);
    history.current = [...history.current, { role: 'user', content: text }];
    setThinking(true);

    const callCtx: Ch1Context = { ...ctx, seed };
    aborter.current = new AbortController();
    const res = await askHerWith({
      system: buildCh1Prompt(phase, callCtx),
      history: history.current,
      fallback: ch1Fallback(phase, text, callCtx),
      clean: cleanCh1Reply,
      validate: (t) => validateCh1Reply(t, callCtx),
      signal: aborter.current.signal,
    });
    aborter.current = null;
    if (res.reason === 'cancelled') return;

    history.current = [...history.current, { role: 'assistant', content: res.text }];
    push('her', res.text, res.live);
    setThinking(false);
    setDebug({ phase: stage === 'after' ? `afterglow ${afterTurns + 1}` : phase, live: res.live, reason: res.reason });
    if (res.text.includes('수원')) unlock(CH1_UNLOCK.hometown);

    if (phase === 'resolve' || phase === 'resolveEarly') {
      window.setTimeout(startTelegram, 900);
    } else if (stage === 'pre') {
      setTurn((n) => n + 1);
    }
  }, [draft, thinking, mode, stage, push, playerName, commit, play, unlock, startAfter, afterTurns, turn, ctx, startTelegram]);

  /* ---------------- 시작 지점 ---------------- */

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const opening = CH1_OPENING.join('\n');
    if (startAt === 'opening') {
      play([{ kind: 'her', text: opening }], () => toChat('pre'));
      return;
    }
    push('her', opening);
    if (startAt === 'chat') toChat('pre');
    else if (startAt === 'choice') startTelegram();
    else if (startAt === 'after') {
      progress.current = { ...progress.current, nameShared: true, sharedName: playerName.trim() || '손님', choice: 'B' };
      toChat('after');
    }
  }, [startAt, play, toChat, push, startTelegram, playerName]);

  /* ---------------- 나가기 (856:537) ---------------- */

  const leave = useCallback(() => {
    setExitOpen(false);
    aborter.current?.abort();
    setThinking(false);
    setStage('leaving');
    commit({});
    // 작별 인사는 클릭으로 넘기고, "신호가 흐려진다." 는 다 찍히면 저절로 나간다
    play(
      [
        { kind: 'her', text: CH1_FAREWELL },
        { kind: 'narr', text: CH1_FADE },
      ],
      () => window.setTimeout(onExit, 1400),
      { holdLast: true },
    );
  }, [commit, play, onExit]);

  /* ---------------- 키보드 ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (exitOpen) {
        if (e.key === 'Escape') setExitOpen(false);
        return;
      }
      if (e.key === 'Escape' && stage !== 'leaving') {
        setExitOpen(true);
        return;
      }
      if (document.activeElement instanceof HTMLInputElement) {
        if (e.key === 'Enter') {
          e.preventDefault();
          void submit();
        }
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, submit, exitOpen, stage]);

  /* ---------------- 렌더 ---------------- */

  const header =
    stage === 'after' || stage === 'nameAsk'
      ? CH1_HEADER.after
      : mode === 'choice' || question
        ? CH1_HEADER.telegram
        : log.length === 0
          ? CH1_HEADER.door
          : CH1_HEADER.chat;

  const nodeId = mode === 'choice' ? '930:5450' : mode === 'chat' ? '929:5290' : '929:5255';
  const inputReady = mode === 'chat' && !thinking && stage !== 'leaving';
  const placeholder = stage === 'nameAsk' ? '당신의 이름을 알려 주세요' : '';

  return (
    <div className="pr-screen ch1-scene" data-node-id={nodeId}>
      <Ch1Backdrop />
      <Ch1Figure entering={startAt === 'opening' && log.length === 0} />
      <div className="ch1-vignette" aria-hidden />

      {mode === 'subtitle' && <AdvanceLayer onAdvance={advance} label="다음 대사" />}

      <ParlorChrome
        header={header}
        badge={CH1_BADGE}
        tool1Label="기록 (준비 중)"
        tool2Label="나가기"
        onTool2={() => stage !== 'leaving' && setExitOpen(true)}
      />

      {/* 929:5284 — 가운데 자막 */}
      {mode === 'subtitle' && current && (
        <p
          className={`ch1-subtitle${current.kind === 'narr' ? ' ch1-subtitle--narr' : ''}`}
          data-node-id="929:5284"
        >
          {typer.typed}
        </p>
      )}

      {/* 929:5322 ~ 5326 — 채팅 로그 */}
      {mode === 'chat' && log.length > 0 && (
        <div className="pr-chatlog ch1-chatlog">
          {log.map((m) =>
            m.from === 'her' ? (
              <div key={m.id} className="pr-chatlog__row pr-chatlog__row--her">
                <span className="pr-bubble ch1-bubble">{m.text}</span>
              </div>
            ) : (
              <div key={m.id} className="pr-chatlog__row pr-chatlog__row--you">
                <p className="pr-reply ch1-reply">{m.text}</p>
              </div>
            ),
          )}
          {thinking && (
            <div className="pr-chatlog__row pr-chatlog__row--her">
              <span className="pr-bubble pr-bubble--thinking">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>
      )}

      {/* 929:5318 ~ 5321 — 입력창 */}
      {mode === 'chat' && (
        <>
          <input
            className="pr-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!inputReady}
            maxLength={INPUT_MAX}
            placeholder={placeholder}
            aria-label="그녀에게 할 말"
            autoFocus
          />
          <button
            type="button"
            className="pr-btn pr-btn--submit"
            onClick={() => void submit()}
            disabled={!inputReady || !draft.trim()}
          >
            {SUBMIT_LABEL}
          </button>
        </>
      )}

      {/* 930:5486 ~ 5493 — 전보 선택지 */}
      {mode === 'choice' && (
        <>
          <p className="pr-parlor__subtitle" data-node-id="930:5493">
            {question}
          </p>
          {(['A', 'B'] as const).map((id, i) => (
            <button
              key={id}
              type="button"
              className={`pr-btn pr-btn--choice pr-btn--choice-${i + 1} ch1-choice`}
              onClick={() => pick(id)}
            >
              {CH1_CHOICES[id].label}
            </button>
          ))}
        </>
      )}

      {toast && (
        <p className="ch1-toast" role="status">
          그녀에 대해 알게 되었습니다 — {toast}
        </p>
      )}

      {import.meta.env.DEV && (
        <p className="pr-intimacy">
          CH1 · {debug.phase}
          {debug.live === null ? '' : debug.live ? ' · LIVE' : ` · FALLBACK (${debug.reason})`}
        </p>
      )}

      {/* 856:537 — 채팅 중단 확인 */}
      {exitOpen && (
        <div className="ch1-exit" role="dialog" aria-modal="true" aria-label={CH1_EXIT.question}>
          <div className="pr-ending__wash" />
          <ChapterBadge className="pr-ending__badge pr-ending__reveal" label={CH1_BADGE} width={704.992} />
          <NoticeFrame className="pr-ending__frame pr-ending__reveal" style={{ animationDelay: '120ms' }} />
          <p className="pr-ending__line ch1-exit__line pr-ending__reveal" style={{ animationDelay: '240ms' }}>
            {CH1_EXIT.question}
          </p>
          <button
            type="button"
            className="pr-btn pr-ending__btn pr-ending__btn--primary pr-ending__reveal"
            style={{ animationDelay: '320ms' }}
            onClick={() => setExitOpen(false)}
            autoFocus
          >
            {CH1_EXIT.stay}
          </button>
          <button
            type="button"
            className="pr-btn pr-ending__btn pr-ending__btn--secondary pr-ending__reveal"
            style={{ animationDelay: '380ms' }}
            onClick={leave}
          >
            {CH1_EXIT.leave}
          </button>
        </div>
      )}
    </div>
  );
}
