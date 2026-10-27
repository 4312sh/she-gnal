import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRecordHistory } from '../../game/chatHistory';

import { askHerWith, type Turn } from '../../game/her/herChat';
import {
  RE_MARRIAGE,
  buildCh2Prompt,
  ch2Fallback,
  ch2TopicSeed,
  cleanCh2Reply,
  validateCh2Reply,
  type Ch2Context,
} from '../../game/her/chapter2Persona';
import type { Chapter2Save } from '../../game/types';
import { AdvanceLayer } from '../prologue/PrologueParts';
import { useTypewriter } from '../prologue/ParlorParts';
import { ExitModal, PauseOverlay, type ChatMsg } from '../chapter/ChapterParts';
import { today } from '../../game/date';
import { ChapterTop, ChatHistoryView, FinishModal } from '../chapter/ChapterNav';
import { Ch2Backdrop, Ch2Motion, type Ch2Pose, type Ch2Room } from './Ch2Scene';
import her1920Blink from '../../assets/chapter2/her-1920-blink.webp';
import her1920Avatar from '../../assets/chapter2/her-1920-avatar.png';
import {
  CH2_BADGE,
  CH2_CHOICES,
  CH2_EXHIBIT,
  CH2_EXHIBIT_AT,
  CH2_EXHIBIT_Q,
  CH2_FAREWELL,
  CH2_JUMP_PHASES,
  CH2_MAIN_Q,
  CH2_TURN_ORDER,
  CH2_UNLOCK,
  openingLines,
  type Ch1Memory,
  type Ch2ChoiceId,
  type Ch2Phase,
} from './chapter2Script';
import { CH1_CHOICES, CH1_FADE, INPUT_MAX, SUBMIT_LABEL } from '../chapter1/chapter1Script';

/**
 * Chapter 2 셋방 화실 — Figma 930:5328 / 930:5363 / 935:5523 (+ 935:5598 모달)
 *
 * 챕터 1 과 같은 틀(자막 · 채팅 · 선택지 세 모드)이고 흐름만 다르다.
 *
 * 3차 디자인 (Figma 1462:3259 ~ 1555:20494) — 말풍선 기록 대신 한 번에 한 마디씩
 *   시작/대기   1462:3259  그녀의 마지막 말 + 입력란        · 눈 깜빡임
 *   유저의 답변 1462:3311  방금 보낸 말이 아래에 잠깐       · 눈 깜빡임
 *   생각중      1462:3322  (잠시 생각중......)              · 팔짱
 *   공간이동    1497:14586 첫 생각중에 화실 안쪽으로 (어둡게 → 밝게)
 *   그녀의 답변 1502:14649 대사가 타이핑되는 동안          · 손짓
 *   선택지      1555:20494 질문 + 대답 둘                   · 손짓
 *   opening → studio · curate · pride · newspaper · conditions · yours (LLM 6턴)
 *   → 주 선택지 → 반응 → 이어지는 대화 (끝나지 않음, 4턴째에 작품 선택지 한 번)
 *   혼인 이야기를 먼저 꺼내면 그림 이야기를 건너뛰고 신문 단계로 간다.
 */

export type Ch2Start = 'opening' | 'chat' | 'choice' | 'after';

/** 방금 보낸 말이 보이는 시간 (1462:3311) */
const ECHO_MS = 1300;
/** 팔짱 낀 모습이 최소한 보이는 시간 */
const THINK_MIN_MS = 1800;
/** 공간이동 — 어둡게 덮였다 걷히기까지 */
const WARP_MS = 1600;
/** 말을 마친 뒤 손짓이 이어지는 시간 */
const LINGER_MS = 3500;

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

type Line = { kind: 'her' | 'narr'; text: string };
type Stage = 'pre' | 'after' | 'leaving';
type Mode = 'subtitle' | 'chat' | 'choice';
type Picker = 'main' | 'exhibit';

type Props = {
  ch1: Ch1Memory;
  save?: Chapter2Save;
  onSave: (next: Chapter2Save) => void;
  onExit: () => void;
  /** 위쪽 바의 GO TO MAIN */
  onMain: () => void;
  startAt?: Ch2Start;
};

export default function Chapter2Chat({ ch1, save, onSave, onExit, onMain, startAt = 'opening' }: Props) {
  const [mode, setMode] = useState<Mode>('subtitle');
  const [stage, setStage] = useState<Stage>('pre');
  const [queue, setQueue] = useState<Line[]>([]);
  const [qi, setQi] = useState(0);
  const [log, setLog] = useState<ChatMsg[]>([]);
  useRecordHistory('ch2', log);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [turn, setTurn] = useState(0);
  const [afterTurns, setAfterTurns] = useState(0);
  const [picker, setPicker] = useState<Picker>('main');
  const [question, setQuestion] = useState('');
  const [exitOpen, setExitOpen] = useState(false);
  /** 멈춤 버튼 — 화면을 덮어 두고 아무 데나 누르면 이어진다 */
  const [paused, setPaused] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** 메인으로 나가기 확인 (1462:3273) */
  const [mainOpen, setMainOpen] = useState(false);
  /** 방 — 첫 생각중에 화실 안쪽으로 공간이동 (1497:14586) */
  const [room, setRoom] = useState<Ch2Room>(startAt === 'opening' || startAt === 'chat' ? 'sketch' : 'studio');
  const [warp, setWarp] = useState(false);
  /** 방금 보낸 말 — 생각중으로 넘어가기 전에 잠깐 보인다 (1462:3311) */
  const [echo, setEcho] = useState<string | null>(null);
  /** 팔짱 두 가지를 번갈아 */
  const [tilt, setTilt] = useState(false);
  /** 말을 마친 뒤에도 손짓을 조금 더 이어 간다 */
  const [linger, setLinger] = useState(false);
  const lingerOn = useCallback(() => {
    setLinger(true);
    window.setTimeout(() => setLinger(false), LINGER_MS);
  }, []);
  const [debug, setDebug] = useState<{ phase: string; live: boolean | null; reason?: string }>({
    phase: 'opening',
    live: null,
  });

  /** 이번 접속에서 고른 것 — 프롬프트에 들어간다 (지난 접속 기록과 섞지 않는다) */
  const [choiceId, setChoiceId] = useState<Ch2ChoiceId | undefined>(undefined);
  const [exhibitId, setExhibitId] = useState<Ch2ChoiceId | undefined>(undefined);

  const progress = useRef<Chapter2Save>({
    done: save?.done ?? false,
    choice: save?.choice,
    exhibit: save?.exhibit,
    unlocks: [...(save?.unlocks ?? [])],
    lastAt: today(),
  });
  const exhibitShown = useRef(false);
  const opening = useMemo(() => openingLines(ch1), [ch1]);
  const history = useRef<Turn[]>([
    { role: 'user', content: '(열린 문으로 화실에 들어선다)' },
    { role: 'assistant', content: opening.join(' ') },
  ]);
  const seq = useRef(0);
  const onQueueDone = useRef<(() => void) | null>(null);
  const holdLast = useRef(false);
  const aborter = useRef<AbortController | null>(null);

  const ctx = useMemo<Ch2Context>(
    () => ({
      ch1Done: ch1.done,
      name: ch1.name,
      ch1ChoiceLabel: ch1.choice ? CH1_CHOICES[ch1.choice].label : undefined,
      choiceLabel: choiceId ? CH2_CHOICES[choiceId].label : undefined,
      exhibitLabel: exhibitId ? CH2_EXHIBIT[exhibitId].label : undefined,
    }),
    [ch1, choiceId, exhibitId],
  );

  /* ---------------- 공통 ---------------- */

  const push = useCallback((from: 'her' | 'you', text: string, live?: boolean) => {
    seq.current += 1;
    setLog((l) => [...l, { id: `m${seq.current}`, from, text, live }]);
  }, []);

  const commit = useCallback(
    (patch: Partial<Chapter2Save>) => {
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

  useEffect(() => {
    if (mode !== 'subtitle' || !holdLast.current || !current) return;
    if (qi !== queue.length - 1 || !typer.done) return;
    holdLast.current = false;
    const done = onQueueDone.current;
    onQueueDone.current = null;
    done?.();
  }, [mode, qi, queue.length, typer.done, current]);

  /* ---------------- 흐름 ---------------- */

  const toChat = useCallback((next: Stage) => {
    setStage(next);
    setMode('chat');
  }, []);

  const askMain = useCallback(() => {
    setPicker('main');
    play(
      [{ kind: 'her', text: CH2_MAIN_Q }],
      () => {
        setQuestion(CH2_MAIN_Q);
        setMode('choice');
        setDebug((d) => ({ ...d, phase: 'main choice' }));
      },
      { holdLast: true },
    );
  }, [play]);

  const askExhibit = useCallback(() => {
    exhibitShown.current = true;
    setPicker('exhibit');
    play(
      CH2_EXHIBIT_Q.map((text) => ({ kind: 'her' as const, text })),
      () => {
        setQuestion(CH2_EXHIBIT_Q[CH2_EXHIBIT_Q.length - 1]);
        setMode('choice');
        setDebug((d) => ({ ...d, phase: 'exhibit choice' }));
      },
      { holdLast: true },
    );
  }, [play]);

  const pick = useCallback(
    (id: Ch2ChoiceId) => {
      push('her', question);
      if (picker === 'main') {
        const c = CH2_CHOICES[id];
        push('you', c.label);
        history.current = [...history.current, { role: 'assistant', content: CH2_MAIN_Q }, { role: 'user', content: c.label }];
        commit({ choice: id, done: true });
        setChoiceId(id);
        play(
          [
            ...(c.narration ? [{ kind: 'narr' as const, text: c.narration }] : []),
            ...c.lines.map((text) => ({ kind: 'her' as const, text })),
          ],
          () => {
            history.current = [...history.current, { role: 'assistant', content: c.lines.join(' ') }];
            unlock(CH2_UNLOCK.trait(c.trait));
            toChat('after');
            setDebug((d) => ({ ...d, phase: 'afterglow' }));
          },
        );
        setDebug((d) => ({ ...d, phase: `reaction ${id}` }));
        return;
      }
      const e = CH2_EXHIBIT[id];
      push('you', e.label);
      history.current = [
        ...history.current,
        { role: 'assistant', content: CH2_EXHIBIT_Q.join(' ') },
        { role: 'user', content: e.label },
      ];
      commit({ exhibit: id });
      setExhibitId(id);
      play(
        e.lines.map((text) => ({ kind: 'her' as const, text })),
        () => {
          history.current = [...history.current, { role: 'assistant', content: e.lines.join(' ') }];
          unlock(CH2_UNLOCK.work(e.work));
          toChat('after');
        },
      );
    },
    [push, question, picker, commit, play, unlock, toChat],
  );

  /** 공간이동 — 어둡게 덮었다가 방을 바꾸고 다시 걷는다 */
  const warpTo = useCallback((next: Ch2Room) => {
    setWarp(true);
    window.setTimeout(() => setRoom(next), WARP_MS / 2);
    window.setTimeout(() => setWarp(false), WARP_MS);
  }, []);

  /* ---------------- 입력 ---------------- */

  const submit = useCallback(async () => {
    const text = draft.trim();
    if (!text || thinking || mode !== 'chat') return;
    setDraft('');

    let phase: Ch2Phase;
    let seed: string | undefined;
    let jumped = false;
    if (stage === 'after') {
      const n = afterTurns + 1;
      setAfterTurns(n);
      phase = 'afterglow';
      seed = ch2TopicSeed(n);
    } else {
      const base = CH2_TURN_ORDER[Math.min(turn, CH2_TURN_ORDER.length - 1)];
      jumped = CH2_JUMP_PHASES.includes(base) && RE_MARRIAGE.test(text);
      phase = jumped ? 'newspaper' : base;
    }

    push('you', text);
    history.current = [...history.current, { role: 'user', content: text }];
    setThinking(true);
    setTilt((t) => !t);
    setEcho(text);
    window.setTimeout(() => setEcho(null), ECHO_MS);

    // 처음 생각에 잠길 때 화실 안쪽으로 자리를 옮긴다
    const moving = room === 'sketch';
    if (moving) window.setTimeout(() => warpTo('studio'), ECHO_MS + 900);

    const callCtx: Ch2Context = { ...ctx, seed };
    aborter.current = new AbortController();
    const [res] = await Promise.all([
      askHerWith({
        system: buildCh2Prompt(phase, callCtx),
        history: history.current,
        fallback: ch2Fallback(phase, text),
        clean: cleanCh2Reply,
        validate: (t) => validateCh2Reply(t, callCtx),
        signal: aborter.current.signal,
      }),
      // 생각하는 몸짓이 한 번은 보이게
      wait(moving ? ECHO_MS + 900 + WARP_MS + 1200 : ECHO_MS + THINK_MIN_MS),
    ]);
    aborter.current = null;
    if (res.reason === 'cancelled') return;

    history.current = [...history.current, { role: 'assistant', content: res.text }];
    push('her', res.text, res.live);
    setThinking(false);
    setDebug({
      phase: stage === 'after' ? `afterglow ${afterTurns + 1}` : `${phase}${jumped ? ' (혼인 이야기로 건너뜀)' : ''}`,
      live: res.live,
      reason: res.reason,
    });

    // 그녀의 답변 (1502:14649) — 타이핑되는 동안 손짓, 다 나오면 입력란이 돌아온다
    play(
      [{ kind: 'her', text: res.text }],
      () => {
        setMode('chat');
        lingerOn();
        if (phase === 'pride' || jumped) unlock(CH2_UNLOCK.job);
        if (phase === 'newspaper') window.setTimeout(() => unlock(CH2_UNLOCK.marriage), jumped ? 1200 : 0);

        if (stage === 'after') {
          if (!exhibitShown.current && afterTurns + 1 >= CH2_EXHIBIT_AT) window.setTimeout(askExhibit, 900);
          return;
        }
        if (phase === 'yours') {
          window.setTimeout(askMain, 900);
          return;
        }
        setTurn(jumped ? CH2_TURN_ORDER.indexOf('conditions') : turn + 1);
      },
      { holdLast: true },
    );
  }, [draft, thinking, mode, stage, afterTurns, turn, push, ctx, unlock, askExhibit, askMain, room, warpTo, play, lingerOn]);

  /* ---------------- 시작 지점 ---------------- */

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const text = opening.join('\n');
    if (startAt === 'opening') {
      // 다 타이핑되면 그대로 남고 아래에 입력란이 열린다 (1462:3259)
      push('her', text);
      play(
        [{ kind: 'her', text }],
        () => {
          toChat('pre');
          lingerOn();
          setDebug((d) => ({ ...d, phase: 'studio' }));
        },
        { holdLast: true },
      );
      return;
    }
    push('her', text);
    if (startAt === 'chat') toChat('pre');
    else if (startAt === 'choice') askMain();
    else if (startAt === 'after') {
      setChoiceId('B');
      toChat('after');
    }
  }, [startAt, opening, play, toChat, push, askMain, lingerOn]);

  /* ---------------- 메인으로 (1462:3273) ---------------- */

  const goMain = useCallback(() => {
    aborter.current?.abort();
    commit({});
    onMain();
  }, [commit, onMain]);

  /* ---------------- 나가기 (935:5598) ---------------- */

  const leave = useCallback(() => {
    setExitOpen(false);
    aborter.current?.abort();
    setThinking(false);
    setStage('leaving');
    commit({});
    play(
      [
        { kind: 'her', text: CH2_FAREWELL },
        { kind: 'narr', text: CH1_FADE },
      ],
      () => window.setTimeout(onExit, 1400),
      { holdLast: true },
    );
  }, [commit, play, onExit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || historyOpen || mainOpen) return;
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
  }, [advance, submit, exitOpen, stage, paused, historyOpen, mainOpen]);

  /* ---------------- 렌더 ---------------- */

  const nodeId =
    mode === 'choice'
      ? '1555:20494'
      : mode === 'subtitle'
        ? '1502:14649'
        : echo
          ? '1462:3311'
          : thinking
            ? room === 'studio'
              ? '1497:14586'
              : '1462:3322'
            : '1462:3259';
  const inputReady = mode === 'chat' && !thinking && stage !== 'leaving';
  const options = picker === 'main' ? CH2_CHOICES : CH2_EXHIBIT;
  const lastHer = [...log].reverse().find((m) => m.from === 'her')?.text ?? '';

  // 말하는 중(타이핑) · 질문할 때 손짓, 생각할 때 팔짱, 나머지는 눈 깜빡임
  const pose: Ch2Pose =
    mode === 'choice' || (mode === 'subtitle' && current?.kind === 'her' && !typer.done) || (linger && !thinking)
      ? 'gesture'
      : mode === 'chat' && thinking && !echo
        ? 'think'
        : 'blink';

  return (
    <div className="pr-screen ch1-scene ch-chat ch2-chat" data-node-id={nodeId}>
      <Ch2Backdrop room={room} />
      <Ch2Motion pose={pose} tilt={tilt} entering={startAt === 'opening' && log.length <= 1} />
      <div className="ch1-vignette" aria-hidden />

      {/* 1497:14586 — 공간이동: 어둡게 덮었다가 걷힌다 */}
      {warp && <div className="ch2-warp" aria-hidden />}

      {mode === 'subtitle' && <AdvanceLayer onAdvance={advance} label="다음 대사" />}

      {/* 그녀의 말 · 생각중 · 질문 — 아랫선(862)에 맞춰 위로 쌓인다 */}
      {mode === 'subtitle' && current && (
        <p className={`ch2-line${current.kind === 'narr' ? ' ch2-line--narr' : ''}`} data-node-id="1502:14676">
          {typer.typed}
        </p>
      )}

      {mode === 'chat' && echo && (
        <p className="ch2-echo" data-node-id="1462:3321">
          {echo}
        </p>
      )}

      {mode === 'chat' && !echo && thinking && (
        <p className="ch2-line ch2-line--thinking" data-node-id="1497:14636">
          (잠시 생각중......)
        </p>
      )}

      {mode === 'chat' && !thinking && (
        <>
          {lastHer && (
            <p className="ch2-line" data-node-id="1462:3272">
              {lastHer}
            </p>
          )}
          <input
            className="pr-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!inputReady}
            maxLength={INPUT_MAX}
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

      {mode === 'choice' && (
        <>
          <p className="ch2-line" data-node-id="1555:20528">
            {question}
          </p>
          {(['A', 'B'] as const).map((id, i) => (
            <button
              key={id}
              type="button"
              className={`pr-btn pr-btn--choice pr-btn--choice-${i + 1} ch1-choice`}
              onClick={() => pick(id)}
            >
              {options[id].label}
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
          CH2 · {debug.phase}
          {debug.live === null ? '' : debug.live ? ' · LIVE' : ` · FALLBACK (${debug.reason})`}
        </p>
      )}
      {historyOpen && (
        <ChatHistoryView
          chapter="ch2"
          title="네 가지 조건"
          year="1920"
          backdrop={<Ch2Backdrop room={room} />}
          figure={her1920Blink}
          avatar={her1920Avatar}
          onBack={() => setHistoryOpen(false)}
        />
      )}

      {/* 1462:3362 — 맨 위에 마우스를 올리면 내려오는 바 */}
      <ChapterTop
        year="1920"
        title="네 가지 조건"
        paused={paused}
        history={historyOpen}
        pinned={mainOpen}
        onPause={() => setPaused((p) => !p)}
        onExit={() => stage !== 'leaving' && setExitOpen(true)}
        onMain={() => stage !== 'leaving' && setMainOpen(true)}
        onHistory={setHistoryOpen}
      />

      {paused && <PauseOverlay onResume={() => setPaused(false)} />}


      {exitOpen && <ExitModal badge={CH2_BADGE} onStay={() => setExitOpen(false)} onLeave={leave} />}

      {/* 1462:3273 — GO TO MAIN: 메인으로 나가기 */}
      {mainOpen && <FinishModal onHome={goMain} onContinue={() => setMainOpen(false)} />}
    </div>
  );
}
