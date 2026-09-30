import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CHAT_CONFIG, FREE_TURN_CLOSERS, askHer, type Turn } from '../../game/her/herChat';
import { AdvanceLayer } from './PrologueParts';
import { HerFigure, ParlorBackdrop, ParlorChrome, useTypewriter } from './ParlorParts';
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

/**
 * Chapter 0 응접실 — Figma 856:178 / 575 / 219 / 484 / 511
 *
 * 여섯 프레임이 배경·배지·내레이션 바를 공유하고 하단 UI 만 달라서
 * 화면을 쪼개지 않고 하나의 단계 머신으로 돌린다.
 *
 *   narration   856:178   나레이션 3줄, 그녀는 아직 없음
 *   silhouette  856:575   실루엣 + 첫 접촉 3줄
 *   identity    856:219   정체 질문 2줄 + 입력창
 *   free        856:484   자유 대화 (LLM). CHAT_CONFIG.freeTurns 턴
 *   chat        856:484   공간 이야기 (고정 대사)
 *   choice      856:511   2지선다
 *   closing     —         마무리 (자막형)
 *
 * 자유 대화는 실패·지연에 대비해 항상 고정 대사 폴백을 들고 간다.
 * 서버가 없어도 흐름은 멈추지 않는다.
 */

type Stage =
  | 'narration'
  | 'silhouette'
  | 'identity'
  | 'free'
  | 'chat'
  | 'choice'
  | 'closing';

type Msg = { id: string; from: 'her' | 'you'; text: string; live?: boolean };

type Props = {
  onDone: (intimacy: number, answer: ChoiceId | null) => void;
  startAt?: Stage;
};

export default function PrologueChat({ onDone, startAt = 'narration' }: Props) {
  const player = useMemo<Player>(() => loadPlayer(), []);

  const [stage, setStage] = useState<Stage>(startAt);
  const [step, setStep] = useState(0);
  const [log, setLog] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [intimacy, setIntimacy] = useState<number>(INTIMACY.start);
  const [answer, setAnswer] = useState<ChoiceId | null>(null);
  const [thinking, setThinking] = useState(false);
  const [freeUsed, setFreeUsed] = useState(0);
  const [lastLive, setLastLive] = useState<boolean | null>(null);
  const history = useRef<Turn[]>([]);
  const seq = useRef(0);

  const identityLines = useMemo(() => askIdentityLines(player), [player]);
  const ageLine = useMemo(() => ageReaction(player.age), [player.age]);

  /** 자유 대화가 끝난 뒤 그녀가 공간으로 화제를 돌리는 고정 대사 */
  const chatLines = useMemo(() => {
    const [first, ...rest] = PARLOR_TALK;
    return ageLine ? [first, ageLine, ...rest] : [first, ...rest];
  }, [ageLine]);

  const closingLines = useMemo(() => {
    const base = [...CLOSING_LINES];
    if (intimacyTone(intimacy) === 'warm') base.push(CLOSING_WARM_EXTRA);
    return base;
  }, [intimacy]);

  const push = useCallback((from: 'her' | 'you', text: string, live?: boolean) => {
    seq.current += 1;
    setLog((l) => [...l, { id: `m${seq.current}`, from, text, live }]);
  }, []);

  /* ---------------- 현재 단계의 고정 대사 ---------------- */

  const lines: readonly string[] =
    stage === 'narration'
      ? PARLOR_NARRATION
      : stage === 'silhouette'
        ? SILHOUETTE_LINES
        : stage === 'identity'
          ? identityLines
          : stage === 'chat'
            ? chatLines
            : stage === 'closing'
              ? closingLines
              : [];

  const current = lines[step] ?? '';
  const typer = useTypewriter(current);

  /* ---------------- 진행 ---------------- */

  const advance = useCallback(() => {
    if (stage === 'choice' || stage === 'free' || thinking) return;
    if (!typer.done) {
      typer.finish();
      return;
    }
    if (step < lines.length - 1) {
      setStep((n) => n + 1);
      setIntimacy((v) => applyIntimacy(v, 0.5));
      return;
    }
    if (stage === 'narration') {
      setStage('silhouette');
      setStep(0);
    } else if (stage === 'silhouette') {
      setStage('identity');
      setStep(0);
    } else if (stage === 'identity') {
      // 입력 대기
    } else if (stage === 'chat') {
      setStage('choice');
      setStep(0);
    } else if (stage === 'closing') {
      onDone(Math.round(intimacy), answer);
    }
  }, [stage, step, lines.length, typer, intimacy, answer, onDone, thinking]);

  /* ---------------- 자유 대화 (856:219 → 484) ---------------- */

  const waitingInput =
    (stage === 'identity' && step === lines.length - 1 && typer.done) ||
    (stage === 'free' && !thinking);

  const submit = useCallback(async () => {
    if (!waitingInput || thinking) return;
    const text = draft.trim();
    const kind = classifyReply(draft);
    const fallback = REPLY_RESPONSE[kind].line;

    // 첫 제출이면 그녀의 질문을 로그로 옮긴다
    if (stage === 'identity') {
      push('her', identityLines[identityLines.length - 1]);
    }
    if (kind !== 'empty') push('you', text);
    setDraft('');
    setStage('free');
    setThinking(true);

    history.current = [
      ...history.current,
      { role: 'user', content: text || '(대답하지 않는다)' },
    ];

    const res = await askHer(player, intimacy, history.current, fallback);
    history.current = [...history.current, { role: 'assistant', content: res.text }];

    setLastLive(res.live);
    push('her', res.text, res.live);
    setIntimacy((v) => applyIntimacy(v, kind === 'sincere' ? 1 : 0));
    setThinking(false);

    const used = freeUsed + 1;
    setFreeUsed(used);
    if (used >= CHAT_CONFIG.freeTurns) {
      // 자유 대화를 닫고 고정 흐름으로 돌아간다
      const closer = FREE_TURN_CLOSERS[used % FREE_TURN_CLOSERS.length];
      window.setTimeout(() => {
        push('her', closer);
        setStage('chat');
        setStep(0);
      }, 700);
    }
  }, [
    waitingInput,
    thinking,
    draft,
    stage,
    identityLines,
    push,
    player,
    intimacy,
    freeUsed,
  ]);

  /* ---------------- chat 단계: 줄이 넘어갈 때 로그에 쌓기 ---------------- */

  const lastLogged = useRef<string | null>(null);
  useEffect(() => {
    if (stage !== 'chat' || !typer.done) return;
    const key = `${step}:${current}`;
    if (lastLogged.current === key) return;
    lastLogged.current = key;
    push('her', current);
  }, [stage, step, current, typer.done, push]);

  /* ---------------- 선택지 (856:531 / 534) ---------------- */

  const pick = useCallback(
    (id: ChoiceId) => {
      const c = CHOICES.find((x) => x.id === id);
      if (!c) return;
      setAnswer(id);
      push('you', c.label);
      push('her', c.reply);
      setIntimacy((v) => applyIntimacy(v, CHOICE_INTIMACY));
      setStage('closing');
      setStep(0);
    },
    [push],
  );

  /* ---------------- 키보드 ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      if (document.activeElement instanceof HTMLInputElement) {
        if (e.key === 'Enter') {
          e.preventDefault();
          void submit();
        }
        return;
      }
      e.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, submit]);

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

  /* ---------------- 렌더 ---------------- */

  const showFigure = stage !== 'narration';
  const showLog =
    (stage === 'free' || stage === 'chat' || stage === 'closing') && log.length > 0;
  const showInput = stage === 'identity' || stage === 'free';
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
    <div className="pr-screen pr-parlor" data-node-id={nodeId}>
      <ParlorBackdrop deep={stage === 'identity' || stage === 'free' || stage === 'chat'} />

      {showFigure && (
        <HerFigure
          variant={stage === 'silhouette' ? 'silhouette' : 'portrait'}
          entering={stage === 'silhouette'}
        />
      )}

      <AdvanceLayer onAdvance={advance} label="다음 대사" />

      <ParlorChrome />

      {/* 856:195 — 나레이션 3줄 */}
      {stage === 'narration' && (
        <div className="pr-parlor__narration" data-node-id="856:195">
          {PARLOR_NARRATION.map((l, i) => (
            <p key={i} className={i <= step ? 'is-on' : undefined}>
              {i < step ? l : i === step ? typer.typed : '\u200b'}
            </p>
          ))}
        </div>
      )}

      {/* 856:506 ~ 510 — 채팅 로그 */}
      {showLog && (
        <div className="pr-chatlog" data-node-id="856:505">
          {log.map((m) =>
            m.from === 'her' ? (
              <div key={m.id} className="pr-chatlog__row pr-chatlog__row--her">
                <span className="pr-bubble">{m.text}</span>
              </div>
            ) : (
              <div key={m.id} className="pr-chatlog__row pr-chatlog__row--you">
                <p className="pr-reply">{m.text}</p>
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

      {/* 자막형 대사 */}
      {stage === 'silhouette' && (
        <p
          className="pr-parlor__subtitle pr-parlor__subtitle--left"
          data-node-id="856:593"
        >
          {typer.typed}
        </p>
      )}

      {(stage === 'identity' || stage === 'closing') && (
        <p className="pr-parlor__subtitle" data-node-id="856:237">
          {typer.typed}
        </p>
      )}

      {stage === 'choice' && <ChoiceBlock player={player} onPick={pick} />}

      {/* 856:238 ~ 241 — 입력창 */}
      {showInput && (
        <>
          <input
            className="pr-input"
            data-node-id="856:238"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!waitingInput}
            maxLength={60}
            autoFocus={waitingInput}
          />
          <button
            type="button"
            className="pr-btn pr-btn--submit"
            data-node-id="856:240"
            onClick={() => void submit()}
            disabled={!waitingInput}
          >
            {SUBMIT_LABEL}
          </button>
        </>
      )}

      {import.meta.env.DEV && (
        <p className="pr-intimacy">
          INTIMACY {Math.round(intimacy)} / {INTIMACY.cap} ·{' '}
          {intimacyTone(intimacy).toUpperCase()}
          {stage === 'free' || lastLive !== null
            ? ` · FREE ${freeUsed}/${CHAT_CONFIG.freeTurns}${
                lastLive === null ? '' : lastLive ? ' · LIVE' : ' · FALLBACK'
              }`
            : ''}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function ChoiceBlock({
  player,
  onPick,
}: {
  player: Player;
  onPick: (id: ChoiceId) => void;
}) {
  const [line, setLine] = useState(0);
  const lines = useMemo(
    () => [
      `묻겠소. ${player.name?.trim() || '손님'}씨는—`,
      '사람이, 제 뜻대로 살 수 있다고 보시오?',
    ],
    [player.name],
  );
  const typer = useTypewriter(lines[line]);

  useEffect(() => {
    if (!typer.done || line >= lines.length - 1) return;
    const t = window.setTimeout(() => setLine((n) => n + 1), 900);
    return () => window.clearTimeout(t);
  }, [typer.done, line, lines.length]);

  const ready = typer.done && line === lines.length - 1;

  return (
    <>
      <p className="pr-parlor__subtitle" data-node-id="856:536">
        {typer.typed}
      </p>
      {ready &&
        CHOICES.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={`pr-btn pr-btn--choice pr-btn--choice-${i + 1}`}
            onClick={() => onPick(c.id)}
          >
            {c.label}
          </button>
        ))}
    </>
  );
}
