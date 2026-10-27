import { useCallback, useEffect, useRef, useState } from 'react'

import { useRecordHistory } from '../../../game/chatHistory'
import { today } from '../../../game/date'
import { askHerWith, type Turn } from '../../../game/her/herChat'
import { HARI_CRISIS_REPLY, RE_CRISIS } from '../../../game/her/hariTraineePersona'
import type { HariChatSave } from '../../../game/types'
import { useTypewriter } from '../../prologue/ParlorParts'
import { extractName } from '../../chapter1/chapter1Script'
import { ChapterTop, ChatHistoryView, FinishModal } from '../../chapter/ChapterNav'
import { GlassIconSvg } from '../HariIcons'
import { seedTurns, type HariContext, type HariLine, type HariStoryScript, type HariStoryStart } from './hariStoryTypes'
import { HariMotion, RoomBackdrop, type HariPose } from '../prologue/HariPrologueScene'
import '../hari.css'
import './hari-chat.css'
import '../prologue/hari-prologue.css'
import './hari-story.css'

/**
 * 하리 스토리 대화 화면 — 챕터 공용 (2020 「독기 충만 연습생」 · 2023 「데뷔하면 제일 먼저」)
 *
 * 3차 디자인 — 2026 「공연장 뒷편의 대기실」(HariPrologueChat) 과 같은 흐름 · 같은 부품.
 * 말풍선 기록 대신 한 번에 한 마디씩:
 *   하리의 말    가운데 아래 한 줄 (타이핑) — 다 나오면 입력란이 그 아래에 열린다
 *   유저의 답변  방금 보낸 말이 아래에 잠깐
 *   생각중       곱씹는 중....
 *   선택지       질문 + 대답 둘
 * 위쪽 바 · 채팅 기록 · 메인으로 나가기는 나혜석 챕터와 같은 부품 (ChapterNav).
 *
 * 챕터마다 다른 것(대사 · 단계 · 선택지 · LLM 규칙 · 그림 · 색)은 script 로 받는다 (hariStoryTypes).
 */

type Msg = { id: string; from: 'her' | 'you'; text: string; live?: boolean }
type Mode = 'subtitle' | 'chat' | 'choice'
type Stage = 'pre' | 'after' | 'leaving'

type Props = {
  script: HariStoryScript
  playerName: string
  save?: HariChatSave
  onSave: (next: HariChatSave) => void
  /** 마무리 자막이 끝나거나 나가기를 고른 뒤 — 하리 캐릭터 화면 */
  onExit: () => void
  /** 위쪽 바의 GO TO MAIN — 메인(대시보드). 없으면 onExit */
  onMain?: () => void
  /** 이전 챕터에서 이미 만난 사이 — 재회 대사로 시작 */
  met?: boolean
  /** 배경 그림 — 주면 대본(script.background)보다 우선 */
  background?: string
  /** 개발용 진입 지점 */
  startAt?: HariStoryStart
}

/** 방금 보낸 말이 보이는 시간 */
const ECHO_MS = 1300
/** 곱씹는 중이 최소한 보이는 시간 */
const THINK_MIN_MS = 1800
/** 자막이 다 찍힌 뒤 저절로 다음 줄로 넘어가기까지 (클릭 · 스페이스로 더 빨리) */
const AUTO_NEXT_MS = 1600
/** 말을 마친 뒤 웃는 몸짓이 이어지는 시간 (몸짓 그림이 있을 때) */
const LINGER_MS = 4200
/** 공간이동 — 하리가 흐려지는 시간 · 배경이 바뀌는 시간 · 다시 또렷해지는 시간 */
const FADE_OUT_MS = 900
const ROOM_FADE_MS = 1100
const FADE_IN_MS = 900

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

/** 이름을 밝히는 말일 때만 이름을 뽑는다 ("미래에서 왔어요" 같은 말에서 '왔어'를 이름으로 뽑지 않게) */
const NAME_HINT = /(저는|전 |나는|난 |이라고|라고 해|라고 불러|이에요|예요|입니다)/
const NOT_NAME = /(왔|에서|미래|사람|모르|비밀|팬|귀신|아니)/

export default function HariStoryChat({
  script,
  playerName,
  save,
  onSave,
  onExit,
  onMain,
  met = false,
  background,
  startAt = 'opening',
}: Props) {
  const { persona } = script
  const bg = background ?? script.background
  const thinkingText = script.thinking ?? '곱씹는 중'

  /* ---------------- 상태 ---------------- */

  const [mode, setMode] = useState<Mode>('subtitle')
  const [stage, setStage] = useState<Stage>('pre')
  const [queue, setQueue] = useState<HariLine[]>([])
  const [qi, setQi] = useState(0)
  const [log, setLog] = useState<Msg[]>([])
  useRecordHistory(script.historyKey, log)
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [echo, setEcho] = useState<string | null>(null)
  const [turn, setTurn] = useState(0)
  const [afterTurns, setAfterTurns] = useState(0)
  const [exitOpen, setExitOpen] = useState(false)
  const [mainOpen, setMainOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [help, setHelp] = useState(false)
  const [name, setName] = useState(save?.sharedName ?? '')
  const [choiceId, setChoiceId] = useState<string | undefined>(undefined)
  /** 지금 공간 (rooms 가 있을 때) — 선택지 · 이어지는 대화부터 시작하면 마지막 공간 */
  const [room, setRoom] = useState<string>(() => {
    const rs = script.rooms ?? []
    if (!rs.length) return ''
    return startAt === 'choice' || startAt === 'after' ? rs[rs.length - 1].id : rs[0].id
  })
  const roomRef = useRef(room)
  roomRef.current = room
  const [warp, setWarp] = useState<'hold' | 'out' | 'swap' | 'in' | null>(null)
  /** 말을 마친 뒤에도 웃는 몸짓을 조금 더 */
  const [linger, setLinger] = useState(false)
  const lingerTimer = useRef<number | null>(null)
  /** 처음 자막(혼잣말) 동안은 웃지 않는다 */
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
  const history = useRef<Turn[]>(seedTurns(script, met))
  const seq = useRef(0)
  const onQueueDone = useRef<(() => void) | null>(null)
  const holdLast = useRef(false)
  const aborter = useRef<AbortController | null>(null)
  const timers = useRef<number[]>([])

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

  const lingerOn = useCallback(() => {
    setLinger(true)
    if (lingerTimer.current) window.clearTimeout(lingerTimer.current)
    lingerTimer.current = window.setTimeout(() => setLinger(false), LINGER_MS)
  }, [])

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

  /** 자막을 차례로 — 그녀의 말은 기록에도 남긴다 */
  const play = useCallback((lines: HariLine[], done: () => void, opts?: { holdLast?: boolean }) => {
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

  // 마지막 줄을 붙잡아 두는 경우 — 다 찍히면 저절로 다음으로
  useEffect(() => {
    if (mode !== 'subtitle' || !holdLast.current || !current) return
    if (qi !== queue.length - 1 || !typer.done) return
    holdLast.current = false
    if (current.kind === 'her') push('her', current.text)
    const done = onQueueDone.current
    onQueueDone.current = null
    done?.()
  }, [mode, qi, queue.length, typer.done, current, push])

  // 다 찍힌 줄은 잠시 뒤 저절로 넘어간다
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

  const askQuestion = useCallback(() => {
    play([...(script.questionLead?.({ name }) ?? []), { kind: 'her', text: script.question }], () => {
      setMode('choice')
      setDebug((d) => ({ ...d, phase: 'choice' }))
    }, { holdLast: true })
  }, [play, script.question, script.questionLead, name])

  const finish = useCallback(() => {
    setStage('leaving')
    commit({ done: true })
    setDebug((d) => ({ ...d, phase: 'closing' }))
    const lines = typeof script.closing === 'function' ? script.closing({ name }) : script.closing
    play(lines, () => later(onExit, 1600), { holdLast: true })
  }, [commit, play, later, onExit, script, name])

  const pick = useCallback(
    (id: string) => {
      const c = script.choices[id]
      push('you', c.label)
      history.current = [
        ...history.current,
        { role: 'assistant', content: script.question },
        { role: 'user', content: c.label },
        { role: 'assistant', content: c.lines.join(' ') },
      ]
      setChoiceId(id)
      commit({ choice: id, done: true })
      setDebug((d) => ({ ...d, phase: `reaction ${id}` }))
      play(
        c.lines.map((text) => ({ kind: 'her' as const, text })),
        () => {
          // 이어지는 대화가 없으면 반응 뒤 바로 마무리
          if (script.afterTurns <= 0) {
            later(finish, 1400)
            return
          }
          toChat('after')
          lingerOn()
        },
        { holdLast: true },
      )
    },
    [push, commit, play, toChat, script, later, finish, lingerOn],
  )

  /** 공간이동 — 하리가 흐려지고, 배경이 다음 공간으로 바뀐 뒤, 다시 또렷해진다 */
  const warpTo = useCallback(
    (to: string, then: () => void) => {
      setWarp('out')
      later(() => {
        setWarp('swap')
        setRoom(to)
      }, FADE_OUT_MS)
      later(() => setWarp('in'), FADE_OUT_MS + ROOM_FADE_MS)
      later(() => {
        setWarp(null)
        then()
      }, FADE_OUT_MS + ROOM_FADE_MS + FADE_IN_MS)
    },
    [later],
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

    let phase: string
    let seed: string | undefined
    let callName = name
    if (stage === 'after') {
      phase = 'after'
      seed = persona.topicSeed(afterTurns + 1)
    } else {
      phase = script.turnOrder[Math.min(turn, script.turnOrder.length - 1)]
      if (turn === 0 && !name) {
        // 첫 턴에서 이름을 밝히면 그다음부터 이름으로 부른다
        const named =
          /이름/.test(text) || (NAME_HINT.test(text) && !NOT_NAME.test(text)) || /^[가-힣A-Za-z]{2,5}$/.test(text)
        const n = named ? extractName(text, playerName) : ''
        if (n && n !== '손님') {
          callName = n
          setName(n)
          commit({ sharedName: n })
        }
      }
    }

    const ctx: HariContext = {
      name: callName,
      choiceLabel: choiceId ? script.choices[choiceId].label : undefined,
      seed,
      met,
    }
    aborter.current = new AbortController()
    const [res] = await Promise.all([
      askHerWith({
        system: persona.buildPrompt(phase, ctx),
        history: history.current,
        fallback: persona.fallback(phase, text, ctx),
        clean: persona.clean,
        validate: persona.validate,
        maxTokens: 160,
        signal: aborter.current.signal,
      }),
      wait(ECHO_MS + THINK_MIN_MS),
    ])
    aborter.current = null
    if (res.reason === 'cancelled') return

    history.current = [...history.current, { role: 'assistant', content: res.text }]
    setThinking(false)
    setDebug({ phase: stage === 'after' ? `after ${afterTurns + 1}` : phase, live: res.live, reason: res.reason })

    // 하리의 답변 — 타이핑되고, 다 나오면 입력란이 돌아온다
    play(
      [{ kind: 'her', text: res.text }],
      () => {
        setMode('chat')
        lingerOn()
        if (stage === 'after') {
          const n = afterTurns + 1
          setAfterTurns(n)
          if (n >= script.afterTurns) later(finish, 1600)
          return
        }
        const last = turn >= script.turnOrder.length - 1
        const w = script.warps?.[phase]
        if (w) {
          // 다음 공간으로 — 떠나는 말 → 공간이동 → 도착한 말 (to 가 지금 공간이면 이동 없이 도착한 말만)
          // 대답이 끝나고 이동이 시작되기 전까지 입력은 잠가 둔다
          setWarp('hold')
          const arrive = () => {
            setWarp(null)
            if (last) {
              if (w.in.length) play(w.in, askQuestion)
              else askQuestion()
              return
            }
            const goOn = () => {
              setTurn((n) => n + 1)
              toChat('pre')
              lingerOn()
            }
            if (w.in.length) play(w.in, goOn, { holdLast: true })
            else goOn()
          }
          const move = () => (w.to === roomRef.current ? arrive() : later(() => warpTo(w.to, arrive), 900))
          later(() => (w.out.length ? play(w.out, move, { holdLast: true }) : move()), 1200)
          return
        }
        if (last) {
          setWarp('hold')
          later(() => {
            setWarp(null)
            askQuestion()
          }, 1400)
          return
        }
        setTurn((n) => n + 1)
      },
      { holdLast: true },
    )
  }, [draft, thinking, mode, stage, warp, push, later, play, name, afterTurns, turn, commit, choiceId, finish, askQuestion, persona, script, playerName, met, lingerOn, warpTo, toChat])

  /* ---------------- 시작 지점 ---------------- */

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const firstAsk = () => {
      setOpened(true)
      setDebug((d) => ({ ...d, phase: script.turnOrder[0] }))
      play([{ kind: 'her', text: script.firstAsk({ met }) }], () => {
        toChat('pre')
        lingerOn()
      }, { holdLast: true })
    }
    if (startAt === 'opening') {
      play(
        script.opening({ met }).map((text) => ({ kind: 'her' as const, text })),
        firstAsk,
      )
      return
    }
    if (startAt === 'chat') {
      firstAsk()
      return
    }
    if (startAt === 'choice') {
      askQuestion()
      return
    }
    const id = script.choiceOrder[0]
    setChoiceId(id)
    push('her', script.choices[id].lines.join(' '))
    toChat('after')
  }, [startAt, play, push, toChat, askQuestion, script, met, lingerOn])

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
    play(script.farewell, () => later(onExit, 1400), { holdLast: true })
  }, [commit, play, later, onExit, script.farewell])

  const goMain = useCallback(() => {
    aborter.current?.abort()
    commit({})
    ;(onMain ?? onExit)()
  }, [commit, onMain, onExit])

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
      // 입력란의 Enter 는 form 이 보낸다
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
  const figure = script.motion ?? script.poses?.blink ?? script.figure?.src
  const era = `PRESENT | ${script.year}`

  const backdrop = script.rooms?.length ? (
    <RoomBackdrop rooms={script.rooms} room={room} />
  ) : (
    <>
      <div className={`hr-bg${bg ? '' : ' is-placeholder ht-bg--placeholder'}`} aria-hidden>
        {bg && <img src={bg} alt="" />}
      </div>
      <div className="ht-veil" aria-hidden />
    </>
  )

  // 몸짓 그림이 있을 때 — 유저가 쓰는 중이면 눈 깜빡임, 생각중이면 팔 움직임, 선택지는 손짓,
  // 하리가 말할 때 · 말한 뒤 잠깐은 웃는 몸짓 (처음 혼잣말 동안은 눈 깜빡임)
  const speaking = mode === 'subtitle' && current?.kind === 'her' && !typer.done
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
  const figureStyle = script.figureBox
    ? { top: `${script.figureBox.top}px`, height: `${script.figureBox.height}px` }
    : undefined

  const chrome = (
    <div className="hp-chrome">
      <span className="hp-badge">{script.year}</span>
      <p className="hp-title">{script.title}</p>
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
    <div
      className={`hr-screen hp-screen hs-screen is-${mode} is-tone-${script.tone}${room ? ` is-room-${room}` : ''}`}
      data-node-id={script.nodes[mode]}
    >
      {backdrop}

      {script.poses ? (
        <HariMotion pose={pose} sources={script.poses} fading={warp === 'out' || warp === 'swap'} />
      ) : (
        figure && (
          <div className={`hs-figure${warp === 'out' || warp === 'swap' ? ' is-fading' : ''}`} style={figureStyle} aria-hidden>
            <img src={figure} alt="" draggable={false} />
          </div>
        )
      )}

      <div className="hp-floor" aria-hidden />

      {mode === 'subtitle' && <button type="button" className="ht-advance" onClick={advance} aria-label="다음 대사" />}

      {mode === 'subtitle' && current && (
        <p className={`hp-line${current.kind === 'narr' ? ' hp-line--narr' : ''}`} aria-live="polite">
          {typer.typed}
        </p>
      )}

      {mode === 'chat' && echo && <p className="hp-echo">{echo}</p>}

      {mode === 'chat' && !echo && thinking && (
        <p className="hp-line hp-line--thinking">
          {thinkingText}
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
              maxLength={script.input.max}
              placeholder={script.input.placeholder}
              aria-label="하리에게 할 말"
              autoFocus
            />
            <button type="submit" className="ht-go" disabled={!inputReady || !draft.trim()}>
              {script.input.submit}
            </button>
          </form>
        </>
      )}

      {mode === 'choice' && (
        <>
          <p className="hp-line">{script.question}</p>
          {script.choiceOrder.map((id, i) => (
            <button key={id} type="button" className={`hp-choice hp-choice--${i + 1}`} onClick={() => pick(id)}>
              {script.choices[id].label}
            </button>
          ))}
        </>
      )}

      {help && (
        <p className="ht-help" role="note">
          {script.help}
        </p>
      )}

      {import.meta.env.DEV && (
        <p className="ht-debug">
          {script.year} · {debug.phase}
          {debug.live === null ? '' : debug.live ? ' · LIVE' : ` · FALLBACK (${debug.reason})`}
        </p>
      )}

      {historyOpen && (
        <ChatHistoryView
          chapter={script.historyKey}
          title={script.title}
          year={script.year}
          className="chh--hari hs-history"
          backdrop={backdrop}
          figure={figure ?? ''}
          avatar={script.avatar ?? ''}
          onBack={() => setHistoryOpen(false)}
        />
      )}

      <ChapterTop
        year={script.year}
        era={era}
        title={script.title}
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
        <div className="ht-modal" role="dialog" aria-modal="true" aria-label={script.exit.question}>
          <div className="ht-modal__card">
            <p className="ht-modal__question">{script.exit.question}</p>
            <div className="ht-modal__actions">
              <button type="button" className="ht-modal__btn is-primary" onClick={() => setExitOpen(false)} autoFocus>
                {script.exit.stay}
              </button>
              <button type="button" className="ht-modal__btn" onClick={leave}>
                {script.exit.leave}
              </button>
            </div>
          </div>
        </div>
      )}

      {mainOpen && <FinishModal onHome={goMain} onContinue={() => setMainOpen(false)} />}
    </div>
  )
}
