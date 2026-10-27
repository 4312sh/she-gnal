import { useCallback, useEffect, useRef, useState } from 'react'

import { useRecordHistory } from '../../../game/chatHistory'
import { today } from '../../../game/date'
import { askHerWith, type Turn } from '../../../game/her/herChat'
import { RE_CRISIS } from '../../../game/her/hariTraineePersona'
import {
  buildEioPrompt,
  cleanEioReply,
  eioFallback,
  eioTopicSeed,
  findMisread,
  misreadSystemLine,
  validateEioReply,
  type EioContext,
  type EioPhase,
} from '../../../game/her/eioProloguePersona'
import type { EioPrologueSave } from '../../../game/types'
import { useTypewriter } from '../../prologue/ParlorParts'
import { extractName } from '../../chapter1/chapter1Script'
import { ChapterTop, ChatHistoryView, FinishModal } from '../../chapter/ChapterNav'
import eioAvatar from '../../../assets/character/future/eio-avatar.png'
import { EIO_HISTORY_FIGURE, EioBackdrop, EioMotion, type EioFrame, type EioMotionKind } from './EioScene'
import {
  EIO_BADGE,
  EIO_CHOICES,
  EIO_CHOICE_ORDER,
  EIO_CRISIS_REPLY,
  EIO_FAREWELL,
  EIO_FIRST_ASK,
  EIO_HELP,
  EIO_INPUT,
  EIO_NAME_ASK,
  EIO_NAME_LINES,
  EIO_OPENING,
  EIO_QUESTION,
  EIO_THINKING,
  EIO_TITLE,
  EIO_TURN_ORDER,
  EIO_WARP_AFTER,
  EIO_WARP_IN,
  EIO_WARP_OUT,
  EIO_YEAR,
  type EioLine,
  type EioScene,
  type EioWordId,
} from './eioPrologueScript'
import '../eio.css'
import './eio-chat.css'

/**
 * 이오 · 프롤로그 「고대 신호」 (Figma 1492:14550 · 1373:41123 · 1359:39986 · 1359:40041 · 1359:40068
 *                                · 1563:20530 · 1564:20557 · 1380:41300 · 1359:39915 · 1359:39959)
 *
 * 한 번에 한 마디씩 — 하리 프롤로그(HariPrologueChat)와 같은 흐름이다.
 *   이오의 말    가까이 다가와(answer) 말한다            · sway (못 알아들으면 shake)
 *   입력 대기    이오의 마지막 말 + 입력란                · 쓰는 동안 wave, 비어 있으면 sway
 *   유저의 답변  방금 보낸 말이 아래에 잠깐               · wave
 *   생각중       곱씹는 중...                              · wave
 *   공간이동     이오가 흐려지고 → 흰 빛 → 배경이 스튜디오로 → 다시 또렷해진다
 *   선택지       대답 둘                                   · sway
 *
 * 위쪽 바 · 채팅 기록 · 끝내기 확인은 나혜석 · 하리 챕터와 같은 부품 (ChapterNav).
 */

export type EioPrologueStart = 'opening' | 'chat' | 'studio' | 'choice' | 'after'

const ECHO_MS = 1300
const THINK_MIN_MS = 1700
const FADE_OUT_MS = 800
const SCENE_FADE_MS = 1100
const FADE_IN_MS = 900
const AUTO_NEXT_MIN = 1600

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

type Msg = { id: string; from: 'her' | 'you'; text: string; live?: boolean }
type Mode = 'say' | 'input' | 'choice'
type Stage = 'pre' | 'name' | 'after' | 'leaving'
type Warp = 'out' | 'swap' | 'in' | null

type Props = {
  playerName: string
  save?: EioPrologueSave
  onSave: (next: EioPrologueSave) => void
  /** 작별 뒤 — 이오 캐릭터 화면 */
  onExit: () => void
  /** 위쪽 바의 GO TO MAIN — 메인(대시보드) */
  onMain: () => void
  startAt?: EioPrologueStart
}

export default function EioPrologueChat({ playerName, save, onSave, onExit, onMain, startAt = 'opening' }: Props) {
  const [mode, setMode] = useState<Mode>('say')
  const [stage, setStage] = useState<Stage>('pre')
  const [queue, setQueue] = useState<EioLine[]>([])
  const [qi, setQi] = useState(0)
  const [lastLine, setLastLine] = useState<EioLine | null>(null)
  const [log, setLog] = useState<Msg[]>([])
  useRecordHistory('eioPrologue', log)
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [echo, setEcho] = useState<string | null>(null)
  const [turn, setTurn] = useState(startAt === 'studio' ? EIO_TURN_ORDER.indexOf(EIO_WARP_AFTER) + 1 : 0)
  const [afterTurns, setAfterTurns] = useState(0)
  const [scene, setScene] = useState<EioScene>(startAt === 'opening' || startAt === 'chat' ? 'forest' : 'studio')
  const [warp, setWarp] = useState<Warp>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [help, setHelp] = useState(false)
  const [name, setName] = useState(save?.sharedName ?? '')
  const [wordId, setWordId] = useState<EioWordId | undefined>(save?.word)
  const [debug, setDebug] = useState<{ phase: string; live: boolean | null; reason?: string }>({ phase: 'opening', live: null })

  const progress = useRef<EioPrologueSave>({
    done: save?.done ?? false,
    word: save?.word,
    sharedName: save?.sharedName,
    learned: save?.learned ?? [],
    lastAt: today(),
  })
  /** 한 번 못 알아들은 말 — 두 번째부터는 학습된 것으로 본다 */
  const seen = useRef<string[]>([])
  const history = useRef<Turn[]>([
    { role: 'user', content: '(천 년 전에서 온 신호가 닿는다)' },
    { role: 'assistant', content: EIO_FIRST_ASK.replace('\n', ' ') },
  ])
  const seq = useRef(0)
  const onQueueDone = useRef<(() => void) | null>(null)
  const holdLast = useRef(false)
  const aborter = useRef<AbortController | null>(null)
  const timers = useRef<number[]>([])

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  /* ---------------- 공통 ---------------- */

  const push = useCallback((from: 'her' | 'you', text: string, live?: boolean) => {
    seq.current += 1
    setLog((l) => [...l, { id: `m${seq.current}`, from, text, live }])
  }, [])

  const commit = useCallback(
    (patch: Partial<EioPrologueSave>) => {
      progress.current = { ...progress.current, ...patch, lastAt: today() }
      onSave(progress.current)
    },
    [onSave],
  )

  const learn = useCallback(
    (word: string) => {
      const cur = progress.current.learned ?? []
      if (!cur.includes(word)) commit({ learned: [...cur, word] })
    },
    [commit],
  )

  const play = useCallback((lines: EioLine[], done: () => void, opts?: { holdLast?: boolean }) => {
    onQueueDone.current = done
    holdLast.current = Boolean(opts?.holdLast)
    setQueue(lines)
    setQi(0)
    setMode('say')
  }, [])

  const current = mode === 'say' ? queue[qi] : undefined
  const typer = useTypewriter(current?.text ?? '')

  /** 한 줄을 다 보고 넘길 때 — 그녀의 말은 기록에 남기고, 입력란 위에 띄울 마지막 줄로 둔다 */
  const settle = useCallback(
    (line: EioLine) => {
      if (line.kind === 'her') push('her', line.text)
      setLastLine(line)
    },
    [push],
  )

  const advance = useCallback(() => {
    if (mode !== 'say' || !current) return
    if (!typer.done) {
      typer.finish()
      return
    }
    settle(current)
    if (qi < queue.length - 1) {
      setQi((n) => n + 1)
      return
    }
    const done = onQueueDone.current
    onQueueDone.current = null
    done?.()
  }, [mode, current, typer, settle, qi, queue.length])

  // 마지막 줄을 붙잡아 두는 경우 — 다 찍히면 저절로 다음으로
  useEffect(() => {
    if (mode !== 'say' || !holdLast.current || !current) return
    if (qi !== queue.length - 1 || !typer.done) return
    holdLast.current = false
    const t = window.setTimeout(() => {
      settle(current)
      const done = onQueueDone.current
      onQueueDone.current = null
      done?.()
    }, 900)
    return () => window.clearTimeout(t)
  }, [mode, qi, queue.length, typer.done, current, settle])

  // 다 찍힌 줄은 잠시 뒤 저절로 넘어간다 (클릭 · 스페이스로 더 빨리)
  useEffect(() => {
    if (mode !== 'say' || !current || !typer.done || paused || finishOpen || historyOpen) return
    if (holdLast.current && qi === queue.length - 1) return
    const t = window.setTimeout(advance, Math.max(AUTO_NEXT_MIN, current.text.length * 40))
    return () => window.clearTimeout(t)
  }, [mode, current, typer.done, qi, queue.length, advance, paused, finishOpen, historyOpen])

  /* ---------------- 흐름 ---------------- */

  const toInput = useCallback((next: Stage) => {
    setStage(next)
    setMode('input')
  }, [])

  /** 공간이동 — 이오가 흐려지고, 흰 빛 속에서 배경이 스튜디오로 바뀐 뒤, 다시 또렷해진다 */
  const warpToStudio = useCallback(
    (then: () => void) => {
      setWarp('out')
      later(() => {
        setWarp('swap')
        setScene('studio')
      }, FADE_OUT_MS)
      later(() => setWarp('in'), FADE_OUT_MS + SCENE_FADE_MS)
      later(() => {
        setWarp(null)
        then()
      }, FADE_OUT_MS + SCENE_FADE_MS + FADE_IN_MS)
    },
    [later],
  )

  const askWord = useCallback(() => {
    play(EIO_QUESTION, () => {
      setMode('choice')
      setDebug((d) => ({ ...d, phase: 'choice' }))
    }, { holdLast: true })
  }, [play])

  const askName = useCallback(() => {
    play([{ kind: 'her', text: EIO_NAME_ASK }], () => toInput('name'), { holdLast: true })
    setDebug((d) => ({ ...d, phase: 'name' }))
  }, [play, toInput])

  const pick = useCallback(
    (id: EioWordId) => {
      const c = EIO_CHOICES[id]
      push('you', c.label)
      history.current = [
        ...history.current,
        { role: 'assistant', content: EIO_QUESTION[EIO_QUESTION.length - 1].text },
        { role: 'user', content: c.label },
        { role: 'assistant', content: c.lines.join(' ') },
      ]
      setWordId(id)
      commit({ word: id, done: true })
      learn(c.word)
      setDebug((d) => ({ ...d, phase: `reaction ${id}` }))
      play(
        c.lines.map((text) => ({ kind: 'her' as const, text })),
        () => (name ? toInput('after') : askName()),
        { holdLast: true },
      )
    },
    [push, commit, learn, play, name, toInput, askName],
  )

  /* ---------------- 입력 ---------------- */

  const submit = useCallback(async () => {
    const text = draft.trim()
    if (!text || thinking || mode !== 'input' || stage === 'leaving' || warp) return
    setDraft('')
    push('you', text)
    history.current = [...history.current, { role: 'user', content: text }]
    setEcho(text)
    later(() => setEcho(null), ECHO_MS)
    setThinking(true)

    const reply = (lines: EioLine[], then: () => void) => {
      setThinking(false)
      play(lines, then, { holdLast: true })
    }

    // 위기 신호 — LLM 을 부르지 않고 짧게 받은 뒤 도움 안내를 띄운다
    if (RE_CRISIS.test(text)) {
      setHelp(true)
      await wait(ECHO_MS + THINK_MIN_MS)
      history.current = [...history.current, { role: 'assistant', content: EIO_CRISIS_REPLY }]
      setDebug((d) => ({ ...d, phase: 'crisis', live: false }))
      reply([{ kind: 'her', text: EIO_CRISIS_REPLY }], () => setMode('input'))
      return
    }

    // 이름 나누기 — 고정 대사
    if (stage === 'name') {
      const n = extractName(text, playerName)
      setName(n)
      commit({ sharedName: n })
      await wait(ECHO_MS + 900)
      const lines = EIO_NAME_LINES(n)
      history.current = [...history.current, { role: 'assistant', content: lines.map((l) => l.text).join(' ') }]
      setDebug((d) => ({ ...d, phase: 'names', live: false }))
      reply(lines, () => toInput('after'))
      return
    }

    // 오해 사전 — 처음 듣는 고대어는 못 알아듣는다 (두 번째부터는 학습)
    const learned = progress.current.learned ?? []
    const mis = findMisread(text, learned)
    if (mis) {
      if (seen.current.includes(mis.word)) {
        learn(mis.word)
      } else {
        seen.current.push(mis.word)
        await wait(ECHO_MS + 900)
        history.current = [...history.current, { role: 'assistant', content: mis.line }]
        setDebug((d) => ({ ...d, phase: `misread ${mis.word}`, live: false }))
        reply(
          [
            { kind: 'sys', text: misreadSystemLine() },
            { kind: 'her', text: mis.line, misread: true },
          ],
          () => setMode('input'),
        )
        return
      }
    }

    const phase: EioPhase = stage === 'after' ? 'after' : EIO_TURN_ORDER[Math.min(turn, EIO_TURN_ORDER.length - 1)]
    const ctx: EioContext = {
      name,
      word: wordId ? EIO_CHOICES[wordId].word : undefined,
      learned: progress.current.learned ?? [],
      seed: stage === 'after' ? eioTopicSeed(afterTurns + 1) : undefined,
    }
    aborter.current = new AbortController()
    const [res] = await Promise.all([
      askHerWith({
        system: buildEioPrompt(phase, ctx),
        history: history.current,
        fallback: eioFallback(phase, text),
        clean: cleanEioReply,
        validate: validateEioReply,
        maxTokens: 180,
        signal: aborter.current.signal,
      }),
      wait(ECHO_MS + THINK_MIN_MS),
    ])
    aborter.current = null
    if (res.reason === 'cancelled') return

    history.current = [...history.current, { role: 'assistant', content: res.text }]
    setDebug({ phase: stage === 'after' ? `after ${afterTurns + 1}` : phase, live: res.live, reason: res.reason })

    reply([{ kind: 'her', text: res.text }], () => {
      if (stage === 'after') {
        setAfterTurns((n) => n + 1)
        setMode('input')
        return
      }
      if (phase === EIO_WARP_AFTER) {
        later(
          () =>
            play(EIO_WARP_OUT, () =>
              warpToStudio(() =>
                play(EIO_WARP_IN, () => {
                  setTurn((n) => n + 1)
                  toInput('pre')
                }, { holdLast: true }),
              ),
            { holdLast: true }),
          700,
        )
        return
      }
      if (turn >= EIO_TURN_ORDER.length - 1) {
        later(askWord, 600)
        return
      }
      setTurn((n) => n + 1)
      setMode('input')
    })
  }, [draft, thinking, mode, stage, warp, push, later, play, playerName, commit, toInput, learn, turn, name, wordId, afterTurns, warpToStudio, askWord])

  /* ---------------- 시작 지점 ---------------- */

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const firstAsk = () => {
      setDebug((d) => ({ ...d, phase: 'contact' }))
      play([{ kind: 'her', text: EIO_FIRST_ASK }], () => toInput('pre'), { holdLast: true })
    }
    if (startAt === 'opening') {
      play(EIO_OPENING, firstAsk)
      return
    }
    if (startAt === 'chat') {
      firstAsk()
      return
    }
    if (startAt === 'studio') {
      play(EIO_WARP_IN, () => toInput('pre'), { holdLast: true })
      return
    }
    if (startAt === 'choice') {
      askWord()
      return
    }
    setWordId('lonely')
    setName(playerName || '송신자')
    play([{ kind: 'her', text: EIO_CHOICES.lonely.lines[2] }], () => toInput('after'), { holdLast: true })
  }, [startAt, play, toInput, askWord, playerName])

  /* ---------------- 나가기 · 메인으로 ---------------- */

  const leave = useCallback(() => {
    setFinishOpen(false)
    setHistoryOpen(false)
    aborter.current?.abort()
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setThinking(false)
    setEcho(null)
    setWarp(null)
    setStage('leaving')
    commit({})
    play(EIO_FAREWELL(name, wordId ? EIO_CHOICES[wordId].word : undefined), () => later(onExit, 1200), { holdLast: true })
  }, [commit, play, later, onExit, name, wordId])

  const goMain = useCallback(() => {
    aborter.current?.abort()
    commit({})
    onMain()
  }, [commit, onMain])

  /* ---------------- 키보드 ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (historyOpen || finishOpen) return
      if (paused) {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          setPaused(false)
        }
        return
      }
      if (e.key === 'Escape' && stage !== 'leaving') {
        setFinishOpen(true)
        return
      }
      if (document.activeElement instanceof HTMLInputElement) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, stage, paused, historyOpen, finishOpen])

  /* ---------------- 렌더 ---------------- */

  const inputReady = mode === 'input' && !thinking && stage !== 'leaving' && !warp
  const typing = inputReady && draft.trim() !== ''

  // 쓰는 중 · 보낸 직후 · 생각중 → wave, 못 알아들은 말 → shake, 그 밖 → sway
  const motion: EioMotionKind =
    mode === 'input' && (typing || echo || thinking)
      ? 'wave'
      : mode === 'say' && current?.misread
        ? 'shake'
        : 'sway'
  const frame: EioFrame = mode === 'choice' ? 'choice' : mode === 'say' && current?.kind === 'her' ? 'answer' : 'base'

  const nodeId =
    mode === 'choice'
      ? '1564:20557'
      : mode === 'say'
        ? scene === 'studio'
          ? '1563:20530'
          : '1359:40068'
        : echo
          ? '1359:39986'
          : thinking
            ? '1359:40041'
            : typing
              ? '1492:14550'
              : '1373:41123'

  const chrome = (
    <div className="ec-chrome">
      <span className="ec-badge" data-node-id="1359:39969">
        {EIO_BADGE}
      </span>
      <div className="ec-titlebar" data-node-id="1359:39964">
        <p>{EIO_TITLE}</p>
      </div>
      {/* 1170:10549 — ▶ 잠시 멈춤 · ✕ 끝내기 */}
      <div className="ec-tools">
        <svg width="125" height="56" viewBox="0 0 125 56" fill="none" aria-hidden>
          <rect y="1" width="125" height="53" rx="8" fill="url(#ec-tools-a)" fillOpacity="0.4" />
          <path
            className={paused ? 'is-on' : undefined}
            d="M44.7 26.1C45.8 26.8 45.8 28.4 44.7 29L18.5 44.1C17.4 44.8 16 44 16 42.6L16 12.5C16 11.2 17.4 10.4 18.5 11L44.7 26.1Z"
            fill="url(#ec-tools-b)"
          />
          <path
            d="M100.1 26.9C99.8 27.3 99.8 27.9 100.1 28.3L109.3 37.5C109.7 37.9 109.7 38.5 109.3 38.9L105.1 43.1C104.7 43.5 104.1 43.5 103.7 43.1L94.5 33.9C94.1 33.6 93.5 33.6 93.1 33.9L83.2 43.8C82.8 44.2 82.2 44.2 81.8 43.8L77.5 39.6C77.1 39.2 77.1 38.6 77.5 38.2L87.4 28.3C87.8 27.9 87.8 27.3 87.4 26.9L77.5 17C77.1 16.6 77.1 15.9 77.5 15.6L81.8 11.3C82.2 10.9 82.8 10.9 83.2 11.3L93.1 21.2C93.5 21.6 94.1 21.6 94.5 21.2L103.7 12C104.1 11.6 104.7 11.6 105.1 12L109.3 16.3C109.7 16.7 109.7 17.3 109.3 17.7L100.1 26.9Z"
            fill="url(#ec-tools-c)"
          />
          <defs>
            <linearGradient id="ec-tools-a" x1="0" y1="27.5" x2="125" y2="27.5" gradientUnits="userSpaceOnUse">
              <stop offset="0.5" stopColor="#C8D9F3" />
              <stop offset="1" stopColor="#EAEAEA" />
            </linearGradient>
            <linearGradient id="ec-tools-b" x1="47.2" y1="27.6" x2="15.2" y2="27.6" gradientUnits="userSpaceOnUse">
              <stop offset="0.3" stopColor="white" />
              <stop offset="1" stopColor="#D9D9D9" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="ec-tools-c" x1="79.3" y1="41.4" x2="106.9" y2="13.8" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D9D9D9" stopOpacity="0.2" />
              <stop offset="1" stopColor="white" />
            </linearGradient>
          </defs>
        </svg>
        <button
          type="button"
          className="ec-tools__btn ec-tools__btn--play"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? '이어서 하기' : '잠시 멈춤'}
          aria-pressed={paused}
        />
        <button
          type="button"
          className="ec-tools__btn ec-tools__btn--close"
          onClick={() => stage !== 'leaving' && setFinishOpen(true)}
          aria-label="끝내기"
        />
      </div>
    </div>
  )

  const boxLine = mode === 'say' ? current : mode === 'input' && !thinking && !echo ? lastLine : null

  return (
    <div className={`ec-screen is-${mode} is-scene-${scene}`} data-node-id={nodeId}>
      <EioBackdrop scene={scene} />

      <EioMotion motion={motion} frame={frame} fading={warp === 'out' || warp === 'swap'} />

      {/* 공간이동 — 흰 빛이 차올랐다 걷힌다 */}
      <div className={`ec-warp${warp === 'out' || warp === 'swap' ? ' is-on' : ''}`} aria-hidden />

      {mode === 'say' && <button type="button" className="ec-advance" onClick={advance} aria-label="다음 대사" />}

      {/* 이오의 말 · 나레이션 · 시스템 줄 — 아랫선에 맞춰 위로 쌓인다 (Component 12 · 708×104) */}
      {boxLine && (
        <p
          className={`ec-line ec-line--${boxLine.kind}${mode === 'input' ? ' is-raised' : ''}`}
          aria-live="polite"
        >
          {mode === 'say' ? typer.typed : boxLine.text}
        </p>
      )}

      {mode === 'input' && echo && (
        <p className="ec-echo" data-node-id="1359:40013">
          {echo}
        </p>
      )}

      {mode === 'input' && !echo && thinking && (
        <p className="ec-line ec-line--thinking" data-node-id="1359:40052">
          {EIO_THINKING}
          <span className="ec-dots" aria-hidden>
            <i>.</i>
            <i>.</i>
            <i>.</i>
          </span>
        </p>
      )}

      {/* 1170:10542 — MESSINGER · SEND */}
      {mode === 'input' && !thinking && !echo && (
        <form
          className="ec-messenger"
          data-node-id="1373:41127"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <span className="ec-messenger__tag" aria-hidden>
            MESSINGER
          </span>
          <input
            className="ec-messenger__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!inputReady}
            maxLength={EIO_INPUT.max}
            placeholder={stage === 'name' ? '이름을 알려 주세요' : EIO_INPUT.placeholder}
            aria-label="이오에게 보낼 말"
            autoFocus
          />
          <button type="submit" className="ec-messenger__send" disabled={!inputReady || !draft.trim()}>
            {EIO_INPUT.submit}
          </button>
        </form>
      )}

      {/* 1564:20557 — ANSWER 둘 */}
      {mode === 'choice' &&
        EIO_CHOICE_ORDER.map((id, i) => (
          <button
            key={id}
            type="button"
            className={`ec-choice ec-choice--${i + 1}`}
            data-node-id={i === 0 ? '1564:20576' : '1564:20577'}
            onClick={() => pick(id)}
          >
            <span className="ec-choice__tag" aria-hidden>
              ANSWER
            </span>
            <span className="ec-choice__x" aria-hidden>
              x
            </span>
            <span className="ec-choice__text">{EIO_CHOICES[id].label}</span>
          </button>
        ))}

      {help && (
        <p className="ec-help" role="note">
          {EIO_HELP}
        </p>
      )}

      {import.meta.env.DEV && (
        <p className="ec-debug">
          {EIO_YEAR} · {debug.phase}
          {debug.live === null ? '' : debug.live ? ' · LIVE' : ` · FALLBACK (${debug.reason})`}
        </p>
      )}

      {paused && (
        <div className="ec-pause" role="dialog" aria-modal="true" aria-label="잠시 멈춤" onClick={() => setPaused(false)}>
          <p className="ec-pause__title">PAUSED</p>
          <p className="ec-pause__hint">클릭하거나 스페이스를 누르면 이어집니다</p>
        </div>
      )}

      {historyOpen && (
        <ChatHistoryView
          chapter="eioPrologue"
          title={EIO_TITLE}
          year={EIO_YEAR}
          className="chh--eio"
          backdrop={<EioBackdrop scene={scene} />}
          figure={EIO_HISTORY_FIGURE}
          avatar={eioAvatar}
          onBack={() => setHistoryOpen(false)}
        />
      )}

      <ChapterTop
        year={EIO_YEAR}
        era={`FUTURE | ${EIO_YEAR}`}
        title={EIO_TITLE}
        chrome={chrome}
        paused={paused}
        history={historyOpen}
        pinned={finishOpen}
        onPause={() => setPaused((p) => !p)}
        onExit={() => stage !== 'leaving' && setFinishOpen(true)}
        onMain={() => stage !== 'leaving' && goMain()}
        onHistory={setHistoryOpen}
      />

      {finishOpen && <FinishModal onHome={leave} onContinue={() => setFinishOpen(false)} />}
    </div>
  )
}
