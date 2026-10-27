import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRecordHistory } from '../../game/chatHistory';

import { CHAT_CONFIG, FREE_TURN_CLOSERS, askHer, type Turn } from '../../game/her/herChat';
import { AdvanceLayer } from './PrologueParts';
import { HerFigure, ParlorBackdrop, useTypewriter } from './ParlorParts';
import { ExitModal, PauseOverlay } from '../chapter/ChapterParts';
import { ChapterTop, ChatHistoryView, FinishModal } from '../chapter/ChapterNav';
import { HYESEOK } from '../viewCharacter/avatars';
import herPortrait from '../../assets/prologue/her-portrait.png';
import {
  CHOICES,
  CHOICE_INTIMACY,
  CLOSING_LINES,
  CLOSING_WARM_EXTRA,
  INTIMACY,
  PARLOR_NARRATION,
  PARLOR_TALK,
  REPLY_RESPONSE,
  SILHOUETTE_LINES,
  SUBMIT_LABEL,
  ageReaction,
  applyIntimacy,
  askIdentityLines,
  classifyReply,
  intimacyTone,
  loadPlayer,
  saveChapter0,
  type ChoiceId,
  type Player,
} from './chapter0Script';
import '../chapter1/chapter1.css';
import '../chapter2/chapter2.css';

/**
 * 1935 「첫 조우」 (과거 프롤로그) — 3차 디자인
 *
 * 나혜석 챕터 2 (Chapter2Chat) 와 같은 판:
 *   말풍선 기록 대신 한 번에 한 마디 — 그녀의 말이 아래 한 줄로 타이핑되고, 다 나오면 입력창이 열린다
 *   방금 보낸 말이 잠깐 → (잠시 생각중......) → 그녀의 답
 *   위쪽 바 · 채팅 기록 · 멈춤 · 나가기 · 메인으로는 ChapterNav 부품
 *
 * 흐름은 그대로
 *   narration   나레이션 (그녀는 아직 없음)
 *   silhouette  실루엣 + 첫 접촉
 *   identity    정체 질문 → 입력
 *   free        자유 대화 (LLM) CHAT_CONFIG.freeTurns 턴
 *   chat        공간 이야기 (고정 대사)
 *   choice      2지선다
 *   closing     마무리 → onDone
 */

export type Stage = 'narration' | 'silhouette' | 'identity' | 'free' | 'chat' | 'choice' | 'closing';

type Msg = { id: string; from: 'her' | 'you'; text: string; live?: boolean };
type Line = { kind: 'her' | 'narr'; text: string };
type Mode = 'subtitle' | 'chat' | 'choice';

const YEAR = '1935';
const TITLE = '첫 조우';
const BADGE = `${YEAR}. ${TITLE}`;

const ECHO_MS = 1300;
const THINK_MIN_MS = 1800;
/** 다 찍힌 줄이 저절로 넘어가기까지 (클릭 · 스페이스로 더 빨리) */
const AUTO_NEXT_MS = 1800;

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const her = (text: string): Line => ({ kind: 'her', text });

type Props = {
  onDone: (intimacy: number, answer: ChoiceId | null) => void;
  /** 나가기 · 메인으로 — 대시보드 */
  onExit?: () => void;
  /** GO TO MAIN — 메인 대시보드 (없으면 onExit) */
  onMain?: () => void;
  startAt?: Stage;
};

export default function PrologueChat({ onDone, onExit, onMain, startAt = 'narration' }: Props) {
  const player = useMemo<Player>(() => loadPlayer(), []);

  const [stage, setStage] = useState<Stage>(startAt);
  const [mode, setMode] = useState<Mode>('subtitle');
  const [queue, setQueue] = useState<Line[]>([]);
  const [qi, setQi] = useState(0);
  const [log, setLog] = useState<Msg[]>([]);
  useRecordHistory('prologue', log);
  const [draft, setDraft] = useState('');
  const [intimacy, setIntimacy] = useState<number>(INTIMACY.start);
  const [answer, setAnswer] = useState<ChoiceId | null>(null);
  const [thinking, setThinking] = useState(false);
  const [echo, setEcho] = useState<string | null>(null);
  const [freeUsed, setFreeUsed] = useState(0);
  const [lastLive, setLastLive] = useState<boolean | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [mainOpen, setMainOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  const history = useRef<Turn[]>([]);
  const seq = useRef(0);
  const onQueueDone = useRef<(() => void) | null>(null);
  const holdLast = useRef(false);
  const timers = useRef<number[]>([]);
  const alive = useRef(true);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const identityLines = useMemo(() => askIdentityLines(player), [player]);
  const ageLine = useMemo(() => ageReaction(player.age), [player.age]);

  /** 자유 대화가 끝난 뒤 그녀가 공간으로 화제를 돌리는 고정 대사 */
  const chatLines = useMemo(() => {
    const [first, ...rest] = PARLOR_TALK;
    return ageLine ? [first, ageLine, ...rest] : [first, ...rest];
  }, [ageLine]);

  const questionLines = useMemo(
    () => [`묻겠소. ${player.name?.trim() || '손님'}씨는—`, '사람이, 제 뜻대로 살 수 있다고 보시오?'],
    [player.name],
  );

  const push = useCallback((from: 'her' | 'you', text: string, live?: boolean) => {
    seq.current += 1;
    setLog((l) => [...l, { id: `m${seq.current}`, from, text, live }]);
  }, []);

  /* ---------------- 자막 ---------------- */

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
    setIntimacy((v) => applyIntimacy(v, 0.5));
    if (qi < queue.length - 1) {
      setQi((n) => n + 1);
      return;
    }
    const done = onQueueDone.current;
    onQueueDone.current = null;
    done?.();
  }, [mode, current, typer, push, qi, queue.length]);

  // 마지막 줄을 붙잡아 두는 경우 — 다 찍히면 저절로 다음으로
  useEffect(() => {
    if (mode !== 'subtitle' || !holdLast.current || !current) return;
    if (qi !== queue.length - 1 || !typer.done) return;
    holdLast.current = false;
    if (current.kind === 'her') push('her', current.text);
    const done = onQueueDone.current;
    onQueueDone.current = null;
    done?.();
  }, [mode, qi, queue.length, typer.done, current, push]);

  // 다 찍힌 줄은 잠시 뒤 저절로 넘어간다
  useEffect(() => {
    if (mode !== 'subtitle' || !current || !typer.done || paused || exitOpen || historyOpen || mainOpen) return;
    if (holdLast.current && qi === queue.length - 1) return;
    const t = window.setTimeout(advance, AUTO_NEXT_MS);
    return () => window.clearTimeout(t);
  }, [mode, current, typer.done, qi, queue.length, advance, paused, exitOpen, historyOpen, mainOpen]);

  /* ---------------- 흐름 ---------------- */

  const toInput = useCallback(() => {
    setStage('free');
    setMode('chat');
  }, []);

  const askQuestion = useCallback(() => {
    setStage('choice');
    play(questionLines.map(her), () => setMode('choice'), { holdLast: true });
  }, [play, questionLines]);

  const toTalk = useCallback(
    (closer: string) => {
      setStage('chat');
      play([closer, ...chatLines].map(her), () => later(askQuestion, 600));
    },
    [play, chatLines, later, askQuestion],
  );

  const startIdentity = useCallback(() => {
    setStage('identity');
    play(identityLines.map(her), toInput, { holdLast: true });
  }, [play, identityLines, toInput]);

  const startSilhouette = useCallback(() => {
    setStage('silhouette');
    play(SILHOUETTE_LINES.map(her), startIdentity);
  }, [play, startIdentity]);

  const finishClosing = useCallback(
    (picked: ChoiceId | null, score: number) => {
      setStage('closing');
      const lines = [...CLOSING_LINES];
      if (intimacyTone(score) === 'warm') lines.push(CLOSING_WARM_EXTRA);
      play(lines.map(her), () => later(() => onDone(Math.round(score), picked), 1400), { holdLast: true });
    },
    [play, later, onDone],
  );

  const pick = useCallback(
    (id: ChoiceId) => {
      const c = CHOICES.find((x) => x.id === id);
      if (!c) return;
      setAnswer(id);
      push('you', c.label);
      const score = applyIntimacy(intimacy, CHOICE_INTIMACY);
      setIntimacy(score);
      play([her(c.reply)], () => later(() => finishClosing(id, score), 900), { holdLast: true });
    },
    [push, intimacy, play, later, finishClosing],
  );

  /* ---------------- 자유 대화 ---------------- */

  const inputReady = mode === 'chat' && !thinking && !leaving;

  const submit = useCallback(async () => {
    if (!inputReady) return;
    const text = draft.trim();
    const kind = classifyReply(draft);
    const fallback = REPLY_RESPONSE[kind].line;

    if (kind !== 'empty') {
      push('you', text);
      setEcho(text);
      later(() => setEcho(null), ECHO_MS);
    }
    setDraft('');
    setThinking(true);

    history.current = [...history.current, { role: 'user', content: text || '(대답하지 않는다)' }];

    const [res] = await Promise.all([
      askHer(player, intimacy, history.current, fallback),
      wait((kind !== 'empty' ? ECHO_MS : 0) + THINK_MIN_MS),
    ]);
    if (!alive.current) return;
    history.current = [...history.current, { role: 'assistant', content: res.text }];

    setLastLive(res.live);
    setIntimacy((v) => applyIntimacy(v, kind === 'sincere' ? 1 : 0));
    setThinking(false);

    const used = freeUsed + 1;
    setFreeUsed(used);
    play(
      [her(res.text)],
      () => {
        if (used >= CHAT_CONFIG.freeTurns) {
          // 자유 대화를 닫고 고정 흐름으로 돌아간다
          later(() => toTalk(FREE_TURN_CLOSERS[used % FREE_TURN_CLOSERS.length]), 1400);
          return;
        }
        setMode('chat');
      },
      { holdLast: true },
    );
  }, [inputReady, draft, push, later, player, intimacy, freeUsed, play, toTalk]);

  /* ---------------- 시작 지점 ---------------- */

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (startAt === 'narration') {
      play(
        PARLOR_NARRATION.map((text) => ({ kind: 'narr' as const, text })),
        startSilhouette,
      );
    } else if (startAt === 'silhouette') startSilhouette();
    else if (startAt === 'identity') startIdentity();
    else if (startAt === 'free') {
      push('her', identityLines[identityLines.length - 1]);
      toInput();
    } else if (startAt === 'chat') toTalk(FREE_TURN_CLOSERS[0]);
    else if (startAt === 'choice') askQuestion();
    else finishClosing('A' as ChoiceId, intimacy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- 저장 ---------------- */

  useEffect(() => {
    if (stage !== 'closing') return;
    saveChapter0({
      playerName: player.name ?? '',
      playerAge: player.age,
      chapter0Intimacy: Math.round(intimacy),
      prologueAnswer: answer,
      ageReactionUsed: Boolean(ageLine),
      completed: true,
    });
  }, [stage, player, intimacy, answer, ageLine]);

  /* ---------------- 나가기 · 메인으로 ---------------- */

  const leave = useCallback(() => {
    setExitOpen(false);
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setThinking(false);
    setEcho(null);
    setLeaving(true);
    play(
      [her('…신호가 약해지는군요. 다음에 또 오시오.'), { kind: 'narr', text: '— 신호가 흐려진다.' }],
      () => later(() => (onExit ?? (() => onDone(Math.round(intimacy), answer)))(), 1400),
      { holdLast: true },
    );
  }, [play, later, onExit, onDone, intimacy, answer]);

  /* ---------------- 키보드 ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || historyOpen || mainOpen) return;
      if (exitOpen) {
        if (e.key === 'Escape') setExitOpen(false);
        return;
      }
      if (e.key === 'Escape' && !leaving) {
        setExitOpen(true);
        return;
      }
      if (document.activeElement instanceof HTMLInputElement) {
        if (e.key === 'Enter' && !e.isComposing) {
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
  }, [advance, submit, exitOpen, leaving, paused, historyOpen, mainOpen]);

  /* ---------------- 렌더 ---------------- */

  const showFigure = !(stage === 'narration' && mode === 'subtitle');
  const lastHer = [...log].reverse().find((m) => m.from === 'her')?.text ?? '';
  const nodeId =
    stage === 'narration'
      ? '856:178'
      : stage === 'silhouette'
        ? '856:575'
        : stage === 'identity'
          ? '856:219'
          : stage === 'choice'
            ? '856:511'
            : '856:484';

  return (
    <div className="pr-screen pr-parlor ch-chat ch2-chat pr-chat3" data-node-id={nodeId}>
      <ParlorBackdrop deep={stage !== 'narration' && stage !== 'silhouette'} />

      {showFigure && (
        <HerFigure variant={stage === 'silhouette' ? 'silhouette' : 'portrait'} entering={stage === 'silhouette'} />
      )}
      <div className="ch1-vignette" aria-hidden />

      {mode === 'subtitle' && <AdvanceLayer onAdvance={advance} label="다음 대사" />}

      {mode === 'subtitle' && current && (
        <p className={`ch2-line${current.kind === 'narr' ? ' ch2-line--narr' : ''}`}>{typer.typed}</p>
      )}

      {mode === 'chat' && echo && <p className="ch2-echo">{echo}</p>}

      {mode === 'chat' && !echo && thinking && <p className="ch2-line ch2-line--thinking">(잠시 생각중......)</p>}

      {mode === 'chat' && !thinking && (
        <>
          {lastHer && <p className="ch2-line">{lastHer}</p>}
          <input
            className="pr-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!inputReady}
            maxLength={60}
            aria-label="그녀에게 할 말"
            autoFocus
          />
          <button type="button" className="pr-btn pr-btn--submit" onClick={() => void submit()} disabled={!inputReady}>
            {SUBMIT_LABEL}
          </button>
        </>
      )}

      {mode === 'choice' && (
        <>
          <p className="ch2-line">{questionLines[questionLines.length - 1]}</p>
          {CHOICES.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={`pr-btn pr-btn--choice pr-btn--choice-${i + 1} ch1-choice`}
              onClick={() => pick(c.id)}
            >
              {c.label}
            </button>
          ))}
        </>
      )}

      {import.meta.env.DEV && (
        <p className="pr-intimacy">
          INTIMACY {Math.round(intimacy)} / {INTIMACY.cap} · {intimacyTone(intimacy).toUpperCase()}
          {lastHer && lastLive !== null
            ? ` · FREE ${freeUsed}/${CHAT_CONFIG.freeTurns}${lastLive ? ' · LIVE' : ' · FALLBACK'}`
            : ''}
        </p>
      )}

      {historyOpen && (
        <ChatHistoryView
          chapter="prologue"
          title={TITLE}
          year={YEAR}
          backdrop={<ParlorBackdrop deep />}
          figure={herPortrait}
          avatar={HYESEOK.y1928.lg}
          onBack={() => setHistoryOpen(false)}
        />
      )}

      <ChapterTop
        year={YEAR}
        title={TITLE}
        paused={paused}
        history={historyOpen}
        pinned={mainOpen}
        onPause={() => setPaused((p) => !p)}
        onExit={() => !leaving && setExitOpen(true)}
        onMain={() => !leaving && setMainOpen(true)}
        onHistory={setHistoryOpen}
      />

      {paused && <PauseOverlay onResume={() => setPaused(false)} />}

      {exitOpen && <ExitModal badge={BADGE} onStay={() => setExitOpen(false)} onLeave={leave} />}

      {mainOpen && (
        <FinishModal
          onHome={() => (onMain ?? onExit ?? (() => onDone(Math.round(intimacy), answer)))()}
          onContinue={() => setMainOpen(false)}
        />
      )}
    </div>
  );
}
