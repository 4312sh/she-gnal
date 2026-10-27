import { useCallback, useEffect, useRef, useState } from 'react'

import { useRecordHistory } from '../../../game/chatHistory'
import { today } from '../../../game/date'
import { askHerWith, type Turn } from '../../../game/her/herChat'
import { HARI_CRISIS_REPLY, RE_CRISIS } from '../../../game/her/hariTraineePersona'
import {
  buildHariProloguePrompt,
  cleanHariPrologueReply,
  hariPrologueFallback,
  validateHariPrologueReply,
  type HariPrologueContext,
  type HariProloguePhase,
} from '../../../game/her/hariProloguePersona'
import type { HariChatSave } from '../../../game/types'
import { useTypewriter } from '../../prologue/ParlorParts'
import { extractName } from '../../chapter1/chapter1Script'
import { ChapterTop, ChatHistoryView, FinishModal } from '../../chapter/ChapterNav'
import { GlassIconSvg } from '../HariIcons'
import { HariMotion, PrologueBackdrop, type HariPose, type PrologueRoom } from './HariPrologueScene'
import hariAvatar from '../../../assets/hari/prologue/hari-prologue-avatar.png'
import hariBlink from '../../../assets/hari/prologue/hari-prologue-blink.webp'
import {
  PROLOGUE_AFTER_TURNS,
  PROLOGUE_BADGE,
  PROLOGUE_CHOICES,
  PROLOGUE_CLOSING,
  PROLOGUE_EXIT,
  PROLOGUE_FAREWELL,
  PROLOGUE_FIRST_ASK,
  PROLOGUE_HELP,
  PROLOGUE_INPUT,
  PROLOGUE_OPENING,
  PROLOGUE_QUESTION,
  PROLOGUE_QUESTION_LEAD,
  PROLOGUE_THINKING,
  PROLOGUE_TITLE,
  PROLOGUE_TURN_ORDER,
  PROLOGUE_WARP_IN,
  PROLOGUE_WARP_OUT,
  PROLOGUE_YEAR,
  type PrologueChoiceId,
  type PrologueLine,
} from './hariPrologueScript'
import '../hari.css'
import '../chat/hari-chat.css'
import './hari-prologue.css'

/**
 * 반하리 · 2026 스토리 「공연장 뒷편의 대기실」 (3차 디자인)
 *
 * 말풍선 기록 대신 한 번에 한 마디씩 — 나혜석 챕터 2 (Chapter2Chat) 와 같은 흐름이다.
 *   대화 시작   1373:41149  하리의 말 + 입력란           · 눈 깜빡임
 *   유저의 답변 1359:39625  방금 보낸 말이 아래에 잠깐     · 눈 깜빡임
 *   생각중      1359:39635  곱씹는 중....                  · 팔 움직임
 *   하리의 답변 1359:39645  대사가 타이핑되는 동안 · 뒤로 조금 더 · 웃는 몸짓
 *   공간이동    1484:14471  하리가 흐려지고 → 배경이 무대(1463:4915)로 → 다시 또렷해진다
 *   선택지      1508:14710  질문 + 대답 둘                 · 손짓 (가슴에 손 → 손바닥)
 *   유저가 입력란에 글을 쓰는 동안은 늘 눈 깜빡임으로 돌아온다.
 *
 * 위쪽 바 · 채팅 기록 · 메인으로 나가기는 나혜석 챕터와 같은 부품 (ChapterNav).
 */

export type HariPrologueStart = 'opening' | 'chat' | 'stage' | 'choice' | 'after'

/** 방금 보낸 말이 보이는 시간 (1359:39625) */
const ECHO_MS = 1300
/** 팔 움직임이 최소한 보이는 시간 */
const THINK_MIN_MS = 1800
/** 말을 마친 뒤 웃는 몸짓이 이어지는 시간 */
const LINGER_MS = 4200
/** 공간이동 — 하리가 흐려지는 시간 · 배경이 바뀌는 시간 · 다시 또렷해지는 시간 */
const FADE_OUT_MS = 900
const ROOM_FADE_MS = 1100
const FADE_IN_MS = 900
/** 자막이 다 찍힌 뒤 저절로 다음 줄로 넘어가기까지 (클릭 · 스페이스로 더 빨리 넘길 수 있다) */
const AUTO_NEXT_MS = 1600

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

/** 이름을 밝히는 말일 때만 이름을 뽑는다 */
const NAME_HINT = /(저는|전 |나는|난 |이라고|라고 해|라고 불러|이에요|예요|입니다)/
const NOT_NAME = /(왔|에서|미래|사람|모르|비밀|팬|매니저|제작진|아니)/

type Msg = { id: string; from: 'her' | 'you'; text: string; live?: boolean }
type Mode = 'subtitle' | 'chat' | 'choice'
type Stage = 'pre' | 'after' | 'leaving'
type Warp = 'out' | 'swap' | 'in' | null

type Props = {
  playerName: string
  save?: HariChatSave
  onSave: (next: HariChatSave) => void
  /** 마무리 · 나가기 뒤 — 하리 캐릭터 화면 */
  onExit: () => void
  /** 위쪽 바의 GO TO MAIN — 메인(대시보드) */
  onMain: () => void
  startAt?: HariPrologueStart
}

export default function HariPrologueChat({ playerName, save, onSave, onExit, onMain, startAt = 'opening' }: Props) {
  const [mode, setMode] = useState<Mode>('subtitle')
  const [stage, setStage] = useState<Stage>('pre')
  const [queue, setQueue] = useState<PrologueLine[]>([])
  const [qi, setQi] = useState(0)
  const [log, setLog] = useState<Msg[]>([])
  useRecordHistory('hariPrologue', log)
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [turn, setTurn] = useState(startAt === 'stage' ? 2 : 0)
  const [afterTurns, setAfterTurns] = useState(0)
  const [room, setRoom] = useState<PrologueRoom>(startAt === 'opening' || startAt === 'chat' ? 'city' : 'stage')
  const [warp, setWarp] = useState<Warp>(null)
  const [echo, setEcho] = useState<string | null>(null)
  const [linger, setLinger] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [mainOpen, setMainOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [help, setHelp] = useState(false)
  const [name, setName] = useState(save?.sharedName ?? '')
  const [choiceId, setChoiceId] = useState<PrologueChoiceId | undefined>(undefined)
  /** 거울 앞에서 놀라는 첫 자막이 끝났는가 — 그 전엔 웃지 않는다 */
  const [opened, setOpened] = useState(startAt !== 'opening')
  const [debug, setDebug] = useState<{ phase: string; live: boolean | null; reason?: string }>({
    phase: 'opening',
    live: null,
  })

  const progress = useRef<HariChatSave>({
    done: save?.done ?? false,
    choice: save?.choice,
    sharedName: save?.sharedName,
    lastAt: today(),
  })
  const history = useRef<Turn[]>([
    { role: 'user', content: '(아무도 없는 대기실에 목소리만 있는 상대가 말을 건다)' },
    { role: 'assistant', content: [...PROLOGUE_OPENING.map((l) => l.text), PROLOGUE_FIRST_ASK].join(' ') },
  ])
  const seq = useRef(0)
  const onQueueDone = useRef<(() => void) | null>(null)
  const holdLast = useRef(false)
  const aborter = useRef<AbortController | null>(null)
  const timers = useRef<number[]>([])
  const lingerTimer = useRef<number | null>(null)

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      if (lingerTimer.current) window.clearTimeout(lingerTimer.current)
    },
    [],
  )

  /* ---------------- 공통 ---------------- */

  const push = useCallback((from: 'her' | 'you', text: string, live?: boolean) => {
    seq.current += 1
    setLog((l) => [...l, { id: `m${seq.current}`, from, text, live }])
  }, [])

  const commit = useCallback(
    (patch: Partial<HariChatSave>) => {
      progress.current = { ...progress.current, ...patch, lastAt: today() }
      onSave(progress.current)
    },
    [onSave],
  )

  const lingerOn = useCallback(() => {
    setLinger(true)
    if (lingerTimer.current) window.clearTimeout(lingerTimer.current)
    lingerTimer.current = window.setTimeout(() => setLinger(false), LINGER_MS)
  }, [])

  /** 자막을 차례로 — 그녀의 말은 기록에도 남긴다 */
  const play = useCallback((lines: PrologueLine[], done: () => void, opts?: { holdLast?: boolean }) => {
    onQueueDone.current = done
    holdLast.current = Boolean(opts?.holdLast)
    setQueue(lines)
    setQi(0)
    setMode('subtitle')
  }, [])

  const current = mode === 'subtitle' ? queue[qi] : undefined
  const typer = useTypewriter(current?.text ?? '')

  const advance = useCallback(() => {
    if (mode !== 'subtitle' || !current) return
    if (!typer.done) {
      typer.finish()
      return
    }
    if (current.kind === 'her') push('her', current.text)
    if (qi < queue.length - 1) {
      setQi((n) => n + 1)
      return
    }
    const done = onQueueDone.current
    onQueueDone.current = null
    done?.()
  }, [mode, current, typer, push, qi, queue.length])

  // 마지막 줄을 붙잡아 두는 경우 — 다 찍히면 저절로 다음으로 (그녀의 말은 기록에 남긴다)
  useEffect(() => {
    if (mode !== 'subtitle' || !holdLast.current || !current) return
    if (qi !== queue.length - 1 || !typer.done) return
    holdLast.current = false
    if (current.kind === 'her') push('her', current.text)
    const done = onQueueDone.current
    onQueueDone.current = null
    done?.()
  }, [mode, qi, queue.length, typer.done, current, push])

  // 다 찍힌 줄은 잠시 뒤 저절로 넘어간다 — 대화 중간에 클릭을 기다리며 멈춰 있지 않게
  useEffect(() => {
    if (mode !== 'subtitle' || !current || !typer.done || paused || exitOpen || historyOpen || mainOpen) return
    if (holdLast.current && qi === queue.length - 1) return
    const t = window.setTimeout(advance, AUTO_NEXT_MS)
    return () => window.clearTimeout(t)
  }, [mode, current, typer.done, qi, queue.length, advance, paused, exitOpen, historyOpen, mainOpen])

  /* ---------------- 흐름 ---------------- */

  const toChat = useCallback((next: Stage) => {
    setStage(next)
    setMode('chat')
  }, [])

  /** 공간이동 — 하리가 흐려지고, 배경이 무대로 바뀐 뒤, 다시 또렷해진다 */
  const warpToStage = useCallback(
    (then: () => void) => {
      setWarp('out')
      later(() => {
        setWarp('swap')
        setRoom('stage')
      }, FADE_OUT_MS)
      later(() => setWarp('in'), FADE_OUT_MS + ROOM_FADE_MS)
      later(() => {
        setWarp(null)
        then()
      }, FADE_OUT_MS + ROOM_FADE_MS + FADE_IN_MS)
    },
    [later],
  )

  const askQuestion = useCallback(() => {
    play(
      [
        { kind: 'her', text: PROLOGUE_QUESTION_LEAD(name) },
        { kind: 'her', text: PROLOGUE_QUESTION },
      ],
      () => {
        setMode('choice')
        setDebug((d) => ({ ...d, phase: 'choice' }))
      },
      { holdLast: true },
    )
  }, [play, name])

  const finish = useCallback(() => {
    setStage('leaving')
    commit({ done: true })
    setDebug((d) => ({ ...d, phase: 'closing' }))
    play(PROLOGUE_CLOSING(name), () => later(onExit, 1600), { holdLast: true })
  }, [commit, play, name, later, onExit])

  const pick = useCallback(
    (id: PrologueChoiceId) => {
      const c = PROLOGUE_CHOICES[id]
      push('you', c.label)
      history.current = [
        ...history.current,
        { role: 'assistant', content: PROLOGUE_QUESTION },
        { role: 'user', content: c.label },
        { role: 'assistant', content: c.lines.join(' ') },
      ]
      setChoiceId(id)
      commit({ choice: id, done: true })
      setDebug((d) => ({ ...d, phase: `reaction ${id}` }))
      play(
        c.lines.map((text) => ({ kind: 'her' as const, text })),
        () => {
          toChat('after')
          lingerOn()
        },
        { holdLast: true },
      )
    },
    [push, commit, play, toChat, lingerOn],
  )

  /* ---------------- 입력 ---------------- */

  const submit = useCallback(async () => {
    const text = draft.trim()
    if (!text || thinking || mode !== 'chat' || stage === 'leaving' || warp) return
    setDraft('')
    push('you', text)
    history.current = [...history.current, { role: 'user', content: text }]
    setEcho(text)
    later(() => setEcho(null), ECHO_MS)
    setThinking(true)
    setLinger(false)

    // 위기 신호 — LLM 을 부르지 않고 짧게 받아 준 뒤 도움 안내를 띄운다
    if (RE_CRISIS.test(text)) {
      setHelp(true)
      await wait(ECHO_MS + THINK_MIN_MS)
      setThinking(false)
      history.current = [...history.current, { role: 'assistant', content: HARI_CRISIS_REPLY }]
      setDebug((d) => ({ ...d, phase: 'crisis', live: false }))
      play([{ kind: 'her', text: HARI_CRISIS_REPLY }], () => {
        setMode('chat')
        lingerOn()
      }, { holdLast: true })
      return
    }

    const phase: HariProloguePhase =
      stage === 'after' ? 'after' : PROLOGUE_TURN_ORDER[Math.min(turn, PROLOGUE_TURN_ORDER.length - 1)]

    let callName = name
    if (phase === 'identity' && !name) {
      const named =
        /이름/.test(text) || (NAME_HINT.test(text) && !NOT_NAME.test(text)) || /^[가-힣A-Za-z]{2,5}$/.test(text)
      const n = named ? extractName(text, playerName) : ''
      if (n && n !== '손님') {
        callName = n
        setName(n)
        commit({ sharedName: n })
      }
    }

    const ctx: HariPrologueContext = {
      name: callName,
      choiceLabel: choiceId ? PROLOGUE_CHOICES[choiceId].label : undefined,
    }
    aborter.current = new AbortController()
    const [res] = await Promise.all([
      askHerWith({
        system: buildHariProloguePrompt(phase, ctx),
        history: history.current,
        fallback: hariPrologueFallback(phase, text, ctx),
        clean: cleanHariPrologueReply,
        validate: validateHariPrologueReply,
        maxTokens: 160,
        signal: aborter.current.signal,
      }),
      // 곱씹는 몸짓이 한 번은 보이게
      wait(ECHO_MS + THINK_MIN_MS),
    ])
    aborter.current = null
    if (res.reason === 'cancelled') return

    history.current = [...history.current, { role: 'assistant', content: res.text }]
    setThinking(false)
    setDebug({ phase: stage === 'after' ? `after ${afterTurns + 1}` : phase, live: res.live, reason: res.reason })

    // 하리의 답변 — 타이핑되는 동안 웃는 몸짓, 다 나오면 입력란이 돌아온다
    play(
      [{ kind: 'her', text: res.text }],
      () => {
        setMode('chat')
        lingerOn()
        if (stage === 'after') {
          const n = afterTurns + 1
          setAfterTurns(n)
          if (n >= PROLOGUE_AFTER_TURNS) later(finish, 1600)
          return
        }
        if (phase === 'space') {
          // 무대 쪽으로 공간이동
          later(
            () =>
              play(
                [{ kind: 'her', text: PROLOGUE_WARP_OUT }],
                () =>
                  later(
                    () =>
                      warpToStage(() =>
                        play([{ kind: 'her', text: PROLOGUE_WARP_IN }], () => {
                          setTurn(2)
                          toChat('pre')
                          lingerOn()
                        }, { holdLast: true }),
                      ),
                    900,
                  ),
                { holdLast: true },
              ),
            1200,
          )
          return
        }
        if (phase === 'stage') {
          later(askQuestion, 1400)
          return
        }
        setTurn((n) => n + 1)
      },
      { holdLast: true },
    )
  }, [draft, thinking, mode, stage, warp, push, later, play, lingerOn, turn, name, playerName, commit, choiceId, afterTurns, finish, warpToStage, toChat, askQuestion])

  /* ---------------- 시작 지점 ---------------- */

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const firstAsk = () => {
      setOpened(true)
      setDebug((d) => ({ ...d, phase: 'identity' }))
      play([{ kind: 'her', text: PROLOGUE_FIRST_ASK }], () => {
        toChat('pre')
        lingerOn()
      }, { holdLast: true })
    }
    if (startAt === 'opening') {
      play(PROLOGUE_OPENING, firstAsk)
      return
    }
    if (startAt === 'chat') {
      firstAsk()
      return
    }
    if (startAt === 'stage') {
      push('her', PROLOGUE_WARP_IN)
      toChat('pre')
      return
    }
    if (startAt === 'choice') {
      askQuestion()
      return
    }
    setChoiceId('backstage')
    push('her', PROLOGUE_CHOICES.backstage.lines.join(' '))
    toChat('after')
  }, [startAt, play, toChat, lingerOn, push, askQuestion])

  /* ---------------- 나가기 · 메인으로 ---------------- */

  const leave = useCallback(() => {
    setExitOpen(false)
    aborter.current?.abort()
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setThinking(false)
    setEcho(null)
    setWarp(null)
    setStage('leaving')
    commit({})
    play(PROLOGUE_FAREWELL, () => later(onExit, 1400), { holdLast: true })
  }, [commit, play, later, onExit])

  const goMain = useCallback(() => {
    aborter.current?.abort()
    commit({})
    onMain()
  }, [commit, onMain])

  /* ---------------- 키보드 ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (historyOpen || mainOpen) return
      if (paused) {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          setPaused(false)
        }
        return
      }
      if (exitOpen) {
        if (e.key === 'Escape') setExitOpen(false)
        return
      }
      if (e.key === 'Escape' && stage !== 'leaving') {
        setExitOpen(true)
        return
      }
      // 입력란의 Enter 는 form 이 보낸다 (여기서 또 보내면 두 번 간다)
      if (document.activeElement instanceof HTMLInputElement) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, exitOpen, stage, paused, historyOpen, mainOpen])

  /* ---------------- 렌더 ---------------- */

  const inputReady = mode === 'chat' && !thinking && stage !== 'leaving' && !warp
  const lastHer = [...log].reverse().find((m) => m.from === 'her')?.text ?? ''
  const speaking = mode === 'subtitle' && current?.kind === 'her' && !typer.done

  // 유저가 쓰는 중이면 눈 깜빡임, 생각중이면 팔 움직임, 선택지를 고르는 동안은 손짓,
  // 말할 때 · 말한 뒤 잠깐은 웃는 몸짓
  // (처음 거울 앞에서 놀라는 자막 동안은 눈 깜빡임)
  const typing = mode === 'chat' && !thinking && draft.trim() !== ''
  const pose: HariPose =
    mode === 'chat' && thinking && !echo
      ? 'think'
      : typing
        ? 'blink'
        : mode === 'choice'
          ? 'choice'
          : opened && (speaking || linger)
            ? 'smile'
          : 'blink'

  const nodeId =
    mode === 'choice'
      ? '1508:14710'
      : warp
        ? '1484:14471'
        : mode === 'subtitle'
          ? room === 'stage'
            ? '1463:4915'
            : '1359:39645'
          : echo
            ? '1359:39625'
            : thinking
              ? '1359:39635'
              : '1373:41149'

  const chrome = (
    <div className="hp-chrome">
      <span className="hp-badge" data-node-id="1345:37701">
        {PROLOGUE_BADGE}
      </span>
      <p className="hp-title" data-node-id="1465:9753">
        {PROLOGUE_TITLE}
      </p>
      <div className="hp-tools">
        <button
          type="button"
          className={`hr-glassbtn${paused ? ' is-on' : ''}`}
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? '이어서 하기' : '잠시 멈춤'}
          aria-pressed={paused}
        >
          <GlassIconSvg icon="play" />
        </button>
        <button
          type="button"
          className="hr-glassbtn"
          onClick={() => stage !== 'leaving' && setExitOpen(true)}
          aria-label="대화 나가기"
        >
          <GlassIconSvg icon="close" />
        </button>
      </div>
    </div>
  )

  return (
    <div className={`hr-screen hp-screen is-${mode} is-room-${room}`} data-node-id={nodeId}>
      <PrologueBackdrop room={room} />

      <HariMotion pose={pose} fading={warp === 'out' || warp === 'swap'} />

      {/* 1359:39643 — 아래쪽 붉은 그라데이션 */}
      <div className="hp-floor" aria-hidden />

      {mode === 'subtitle' && <button type="button" className="ht-advance" onClick={advance} aria-label="다음 대사" />}

      {/* 하리의 말 · 생각중 · 질문 — 아랫선에 맞춰 위로 쌓인다 (1359:39644) */}
      {mode === 'subtitle' && current && (
        <p className={`hp-line${current.kind === 'narr' ? ' hp-line--narr' : ''}`} aria-live="polite">
          {typer.typed}
        </p>
      )}

      {mode === 'chat' && echo && (
        <p className="hp-echo" data-node-id="1359:39634">
          {echo}
        </p>
      )}

      {mode === 'chat' && !echo && thinking && (
        <p className="hp-line hp-line--thinking" data-node-id="1359:39644">
          {PROLOGUE_THINKING}
          <span className="hp-dots" aria-hidden>
            <i>.</i>
            <i>.</i>
            <i>.</i>
            <i>.</i>
          </span>
        </p>
      )}

      {mode === 'chat' && !thinking && (
        <>
          {lastHer && <p className="hp-line">{lastHer}</p>}
          <form
            className="hp-inputrow"
            data-node-id="1373:41158"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <input
              className="ht-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!inputReady}
              maxLength={PROLOGUE_INPUT.max}
              placeholder={PROLOGUE_INPUT.placeholder}
              aria-label="하리에게 할 말"
              autoFocus
            />
            <button type="submit" className="ht-go" disabled={!inputReady || !draft.trim()}>
              {PROLOGUE_INPUT.submit}
            </button>
          </form>
        </>
      )}

      {mode === 'choice' && (
        <>
          <p className="hp-line" data-node-id="1508:14732">
            {PROLOGUE_QUESTION}
          </p>
          {(['stage', 'backstage'] as const).map((id, i) => (
            <button
              key={id}
              type="button"
              className={`hp-choice hp-choice--${i + 1}`}
              data-node-id={i === 0 ? '1508:14730' : '1508:14731'}
              onClick={() => pick(id)}
            >
              {PROLOGUE_CHOICES[id].label}
            </button>
          ))}
        </>
      )}

      {help && (
        <p className="ht-help" role="note">
          {PROLOGUE_HELP}
        </p>
      )}

      {import.meta.env.DEV && (
        <p className="ht-debug">
          {PROLOGUE_YEAR} · {debug.phase}
          {debug.live === null ? '' : debug.live ? ' · LIVE' : ` · FALLBACK (${debug.reason})`}
        </p>
      )}

      {historyOpen && (
        <ChatHistoryView
          chapter="hariPrologue"
          title={PROLOGUE_TITLE}
          year={PROLOGUE_YEAR}
          className="chh--hari"
          backdrop={<PrologueBackdrop room={room} />}
          figure={hariBlink}
          avatar={hariAvatar}
          onBack={() => setHistoryOpen(false)}
        />
      )}

      {/* 1380:41280 — 맨 위에 마우스를 올리면 내려오는 바 */}
      <ChapterTop
        year={PROLOGUE_YEAR}
        era={`PRESENT | ${PROLOGUE_YEAR}`}
        title={PROLOGUE_TITLE}
        chrome={chrome}
        paused={paused}
        history={historyOpen}
        pinned={mainOpen}
        onPause={() => setPaused((p) => !p)}
        onExit={() => stage !== 'leaving' && setExitOpen(true)}
        onMain={() => stage !== 'leaving' && setMainOpen(true)}
        onHistory={setHistoryOpen}
      />

      {paused && (
        <div className="ht-pause" role="dialog" aria-modal="true" aria-label="잠시 멈춤" onClick={() => setPaused(false)}>
          <p className="ht-pause__title">잠시 멈춤</p>
          <p className="ht-pause__hint">아무 곳이나 누르면 이어서 대화해요</p>
        </div>
      )}

      {exitOpen && (
        <div className="ht-modal" role="dialog" aria-modal="true" aria-label={PROLOGUE_EXIT.question}>
          <div className="ht-modal__card">
            <p className="ht-modal__question">{PROLOGUE_EXIT.question}</p>
            <div className="ht-modal__actions">
              <button type="button" className="ht-modal__btn is-primary" onClick={() => setExitOpen(false)} autoFocus>
                {PROLOGUE_EXIT.stay}
              </button>
              <button type="button" className="ht-modal__btn" onClick={leave}>
                {PROLOGUE_EXIT.leave}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1359:39807 — GO TO MAIN: 메인으로 나가기 */}
      {mainOpen && <FinishModal onHome={goMain} onContinue={() => setMainOpen(false)} />}
    </div>
  )
}
