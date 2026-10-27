/**
 * 효과음 — 파일 없이 Web Audio 로 바로 만든다
 * 우주 · 진동 느낌: 낮은 사인파 · 부드러운 시작 · 떨림(트레몰로) · 긴 잔향. 높고 날카로운 소리는 쓰지 않는다.
 *
 *   hover    버튼 위에 올렸을 때  낮고 짧은 "둥"
 *   click    버튼 누름            떨리는 낮은 펄스
 *   open     창 열림              아래에서 차오르는 공기 + 낮은 화음
 *   close    창 닫힘              가라앉는 공기
 *   confirm  저장 · 확인          천천히 번지는 낮은 화음
 *   connect  돔 (CONNECT TO HER ERA) 깊은 진동이 차오르다 신호가 잡히며 멀리 울림
 *
 *   시간대 설정 · 세팅 준비 · 접속중 1~3
 *   key      숫자 입력            낮고 둥근 "톡" (칸마다 음이 조금씩 다르다)
 *   erase    지우기               한 단계 낮은 "톡"
 *   lock     좌표가 맞음 · 완료   낮은 두 음이 천천히 번짐
 *   engage   GO                   엔진이 걸리는 깊은 쿵 + 공기
 *   alert    신호 없음 경고창     낮게 맥박 치는 경고 두 번
 *   charge   세팅 준비 게이지     웅— 하고 차오르는 엔진 (약 3.7초)
 *   scan     접속중 1             멀리서 울리는 소나 핑 네 번
 *   warp     접속중 2 터널        길게 빨려 들어가는 공기
 *   glitch   신호 끊김            툭툭 끊기는 낮은 잡음
 *   arrive   접속중 3 도착        깊은 쿵 + 넓게 퍼지는 화음
 *   receive  그녀의 신호 수신     심장 박동 같은 낮은 펄스 세 번
 *
 *   진입 — 타이틀 · 이름 · 성별 · 규칙 · 부팅 · 배경 1~3
 *   descend  화면이 아래로 내려감  공기가 가라앉으며 낮은 음이 미끄러짐
 *   boot     가상 환경 부팅       전원이 들어오는 쿵 + 낮게 올라오는 웅
 *
 * 브라우저는 사용자가 한 번 누르기 전에는 소리를 막는다 → 첫 클릭 · 키 입력 때 깨운다.
 * 켜고 끄기는 SETTINGS 에서 (localStorage 'she-gnal:sound').
 */

export type Sfx =
  | 'hover'
  | 'click'
  | 'open'
  | 'close'
  | 'confirm'
  | 'connect'
  // 시간대 설정 ~ 접속 로딩
  | 'key'
  | 'erase'
  | 'lock'
  | 'engage'
  | 'alert'
  | 'charge'
  | 'scan'
  | 'warp'
  | 'glitch'
  | 'arrive'
  | 'receive'
  // 진입 (타이틀 ~ 부팅)
  | 'descend'
  | 'boot'

const KEY = 'she-gnal:sound'
const MASTER = 0.6

let ctx: AudioContext | null = null
let master: GainNode | null = null
/** 잔향으로 보내는 길 */
let send: GainNode | null = null
let noise: AudioBuffer | null = null
let enabled = readEnabled()
const listeners = new Set<(on: boolean) => void>()

/** 넓은 공간의 잔향 — 길게 사그라드는 스테레오 잡음 */
function impulse(c: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function readEnabled() {
  try {
    return window.localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

function audio() {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  // 소리 → (건조한 소리 + 긴 잔향) → 높은 음 깎기 → 출력
  const out = ctx.createGain()
  out.gain.value = MASTER
  const soft = ctx.createBiquadFilter()
  soft.type = 'lowpass'
  soft.frequency.value = 3200
  soft.Q.value = 0.4
  out.connect(soft).connect(ctx.destination)

  master = ctx.createGain()
  master.gain.value = 0.85
  master.connect(out)

  const verb = ctx.createConvolver()
  verb.buffer = impulse(ctx, 3.6, 2.4)
  const wet = ctx.createGain()
  wet.gain.value = 0.55
  send = ctx.createGain()
  send.gain.value = 1
  send.connect(verb).connect(wet).connect(out)
  return ctx
}

/** 첫 사용자 입력 때 소리를 깨운다 */
function unlock() {
  const c = audio()
  if (c && c.state === 'suspended') void c.resume()
}
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlock, { capture: true })
  window.addEventListener('keydown', unlock, { capture: true })
}

export function isSoundOn() {
  return enabled
}

export function setSoundOn(on: boolean) {
  enabled = on
  try {
    window.localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // 저장이 안 돼도 이번 접속에서는 따른다
  }
  listeners.forEach((fn) => fn(on))
}

export function onSoundChange(fn: (on: boolean) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/* ---------------- 소리 조각 ---------------- */

/** 소리 하나가 나가는 길 — 멈출 때 이것만 줄이면 된다 */
type Bus = { dry: GainNode; wet: GainNode }

type ToneOpts = {
  type?: OscillatorType
  from: number
  to?: number
  dur: number
  gain: number
  attack?: number
  /** 잔향으로 보내는 양 0~1 */
  wet?: number
  /** 떨림 — 초당 횟수(시작 · 끝) · 깊이(0~1) */
  trem?: [number, number] | [number, number, number]
  /** 살짝 어긋난 음을 겹쳐 맥놀이(우웅~) */
  detune?: number
  lowpass?: number
}

function tone(c: AudioContext, bus: Bus, at: number, o: ToneOpts) {
  const { type = 'sine', from, to = from, dur, gain, attack = 0.02, wet = 0.4, trem, detune = 0, lowpass } = o
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)

  let tail: AudioNode = g
  if (trem) {
    const [rate, depthV, rateEnd = rate] = trem.length === 3 ? [trem[0], trem[2], trem[1]] : [trem[0], trem[1]]
    const amp = c.createGain()
    amp.gain.value = 1 - depthV / 2
    const lfo = c.createOscillator()
    lfo.frequency.setValueAtTime(rate, at)
    if (rateEnd !== rate) lfo.frequency.linearRampToValueAtTime(rateEnd, at + dur)
    const depth = c.createGain()
    depth.gain.value = depthV / 2
    lfo.connect(depth).connect(amp.gain)
    lfo.start(at)
    lfo.stop(at + dur + 0.05)
    g.connect(amp)
    tail = amp
  }
  if (lowpass) {
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = lowpass
    tail.connect(lp)
    tail = lp
  }
  tail.connect(bus.dry)
  if (wet > 0) {
    const w = c.createGain()
    w.gain.value = wet
    tail.connect(w).connect(bus.wet)
  }

  const voices = detune ? [-detune, detune] : [0]
  voices.forEach((cents) => {
    const osc = c.createOscillator()
    osc.type = type
    osc.detune.value = cents
    osc.frequency.setValueAtTime(from, at)
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + dur)
    const v = c.createGain()
    v.gain.value = 1 / voices.length
    osc.connect(v).connect(g)
    osc.start(at)
    osc.stop(at + dur + 0.05)
  })
}

/** 공기 — 낮은 대역만 남긴 잡음이 차오르거나 가라앉는다 */
function air(
  c: AudioContext,
  bus: Bus,
  at: number,
  { dur, gain, from, to, peak = 0.5, wet = 0.7, q = 2 }: { dur: number; gain: number; from: number; to: number; peak?: number; wet?: number; q?: number },
) {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = noise.getChannelData(0)
    // 갈색 잡음 — 쉬익보다 웅~ 에 가깝다
    let last = 0
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
      d[i] = last * 3.5
    }
  }
  const src = c.createBufferSource()
  src.buffer = noise
  src.loop = true
  src.playbackRate.value = 0.9 + Math.random() * 0.2
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.Q.value = q
  lp.frequency.setValueAtTime(from, at)
  lp.frequency.exponentialRampToValueAtTime(to, at + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + dur * peak)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(lp).connect(g)
  g.connect(bus.dry)
  const w = c.createGain()
  w.gain.value = wet
  g.connect(w).connect(bus.wet)
  src.start(at)
  src.stop(at + dur + 0.05)
}

/** 같은 소리가 너무 빨리 겹치지 않게 (hover 를 훑을 때 · 빠르게 칠 때) */
const lastAt: Partial<Record<Sfx, number>> = {}
const MIN_GAP: Partial<Record<Sfx, number>> = { hover: 0.09, click: 0.05, key: 0.03, erase: 0.03 }

const NOOP = () => {}

/**
 * 소리를 낸다. 돌려받은 함수를 부르면 그 소리만 0.3초에 걸쳐 잦아든다
 * (긴 소리 — charge · scan · warp — 를 화면을 건너뛸 때 끊는 데 쓴다)
 * opts.pitch 는 key 처럼 음 높이가 바뀌는 소리에 (0 이 기본, 1 이 한 단계 위)
 */
export function playSfx(name: Sfx, opts?: { pitch?: number }): () => void {
  if (!enabled) return NOOP
  const c = audio()
  if (!c || c.state !== 'running' || !master || !send) return NOOP
  const t = c.currentTime + 0.005
  const gap = MIN_GAP[name] ?? 0
  if (gap && lastAt[name] !== undefined && t - lastAt[name]! < gap) return NOOP
  lastAt[name] = t

  const bus: Bus = { dry: c.createGain(), wet: c.createGain() }
  bus.dry.connect(master)
  bus.wet.connect(send)
  const stop = () => {
    const now = c.currentTime
    ;[bus.dry, bus.wet].forEach((g) => {
      g.gain.cancelScheduledValues(now)
      g.gain.setValueAtTime(g.gain.value, now)
      g.gain.linearRampToValueAtTime(0, now + 0.3)
    })
  }
  // 오래된 길은 소리가 끝나면 떼어 낸다
  window.setTimeout(() => {
    bus.dry.disconnect()
    bus.wet.disconnect()
  }, 8000)

  const P = (n: number) => n * Math.pow(2, (opts?.pitch ?? 0) / 12)

  switch (name) {
    case 'hover':
      // 낮고 짧은 "둥" — 멀리서 울린다
      tone(c, bus, t, { from: 180, to: 140, dur: 0.22, gain: 0.07, attack: 0.012, wet: 0.5, lowpass: 900 })
      break
    case 'click':
      // 떨리는 낮은 펄스
      tone(c, bus, t, { from: 98, to: 82, dur: 0.5, gain: 0.22, attack: 0.008, trem: [11, 0.7], wet: 0.45 })
      tone(c, bus, t, { from: 196, dur: 0.35, gain: 0.05, attack: 0.02, detune: 9, wet: 0.6, lowpass: 1200 })
      break
    case 'open':
      air(c, bus, t, { dur: 0.9, gain: 0.16, from: 180, to: 900, peak: 0.55 })
      tone(c, bus, t + 0.05, { from: 110, to: 147, dur: 0.85, gain: 0.1, attack: 0.25, detune: 7, wet: 0.7 })
      tone(c, bus, t + 0.12, { from: 220, to: 294, dur: 0.8, gain: 0.04, attack: 0.3, detune: 6, wet: 0.8, lowpass: 1500 })
      break
    case 'close':
      air(c, bus, t, { dur: 0.7, gain: 0.12, from: 900, to: 160, peak: 0.2 })
      tone(c, bus, t, { from: 147, to: 82, dur: 0.7, gain: 0.1, attack: 0.04, detune: 7, wet: 0.6 })
      break
    case 'confirm':
      tone(c, bus, t, { from: 110, dur: 1.4, gain: 0.12, attack: 0.08, detune: 6, wet: 0.7 })
      tone(c, bus, t + 0.06, { from: 165, dur: 1.3, gain: 0.07, attack: 0.12, detune: 6, wet: 0.75 })
      tone(c, bus, t + 0.12, { from: 220, dur: 1.2, gain: 0.05, attack: 0.16, detune: 8, wet: 0.85, lowpass: 1600 })
      break
    case 'connect':
      tone(c, bus, t, { from: 38, to: 62, dur: 1.9, gain: 0.32, attack: 0.5, trem: [7, 0.8], wet: 0.25 })
      air(c, bus, t, { dur: 1.8, gain: 0.2, from: 120, to: 1400, peak: 0.6, wet: 0.8 })
      tone(c, bus, t + 0.2, { type: 'triangle', from: 73, to: 147, dur: 1.4, gain: 0.08, attack: 0.6, detune: 12, wet: 0.7, lowpass: 700 })
      tone(c, bus, t + 1.05, { from: 220, dur: 2.2, gain: 0.07, attack: 0.03, detune: 5, wet: 0.95 })
      tone(c, bus, t + 1.1, { from: 330, dur: 2.0, gain: 0.04, attack: 0.05, detune: 5, wet: 1, lowpass: 1400 })
      break

    /* ---- 시간대 설정 ---- */
    case 'key':
      // 낮고 둥근 "톡" — 칸마다 음이 조금씩 다르다
      tone(c, bus, t, { from: P(260), to: P(200), dur: 0.16, gain: 0.11, attack: 0.004, wet: 0.35, lowpass: 1100 })
      tone(c, bus, t, { from: P(65), dur: 0.12, gain: 0.12, attack: 0.004, wet: 0.1 })
      break
    case 'erase':
      tone(c, bus, t, { from: 175, to: 120, dur: 0.18, gain: 0.1, attack: 0.004, wet: 0.35, lowpass: 900 })
      break
    case 'lock':
      // 낮은 두 음이 천천히 번진다 (좌표 맞음 · 완료)
      tone(c, bus, t, { from: 131, dur: 1.2, gain: 0.1, attack: 0.03, detune: 6, wet: 0.7 })
      tone(c, bus, t + 0.16, { from: 196, dur: 1.4, gain: 0.08, attack: 0.03, detune: 6, wet: 0.85 })
      tone(c, bus, t + 0.16, { from: 49, dur: 0.6, gain: 0.12, attack: 0.02, wet: 0.2 })
      break
    case 'engage':
      // 엔진이 걸리는 깊은 쿵 + 공기
      tone(c, bus, t, { from: 70, to: 34, dur: 1.1, gain: 0.34, attack: 0.006, wet: 0.35 })
      tone(c, bus, t, { type: 'triangle', from: 110, to: 55, dur: 0.6, gain: 0.08, attack: 0.006, wet: 0.5, lowpass: 600 })
      air(c, bus, t, { dur: 1.3, gain: 0.18, from: 2200, to: 160, peak: 0.08, wet: 0.8 })
      break
    case 'alert':
      // 낮게 맥박 치는 경고 두 번 (어긋난 두 음)
      ;[0, 0.42].forEach((d) => {
        tone(c, bus, t + d, { from: 116.5, dur: 0.36, gain: 0.13, attack: 0.01, trem: [16, 0.8], wet: 0.4 })
        tone(c, bus, t + d, { from: 123.5, dur: 0.36, gain: 0.1, attack: 0.01, wet: 0.4, lowpass: 900 })
      })
      break

    /* ---- 세팅 준비 ---- */
    case 'charge':
      // 웅— 하고 차오르는 엔진: 낮은 음이 올라가고 떨림이 빨라진다
      tone(c, bus, t, { from: 42, to: 92, dur: 3.8, gain: 0.26, attack: 1.2, trem: [3, 18, 0.6], wet: 0.3 })
      tone(c, bus, t + 0.3, { type: 'triangle', from: 84, to: 184, dur: 3.5, gain: 0.05, attack: 1.4, detune: 10, wet: 0.6, lowpass: 800 })
      air(c, bus, t, { dur: 3.8, gain: 0.14, from: 140, to: 1600, peak: 0.85, wet: 0.7 })
      break

    /* ---- 접속중 1 · 2 · 3 ---- */
    case 'scan':
      // 멀리서 울리는 소나 핑 네 번
      ;[0, 0.85, 1.7, 2.55].forEach((d, i) => {
        tone(c, bus, t + d, { from: 392, to: 370, dur: 0.9, gain: 0.07 - i * 0.008, attack: 0.006, wet: 1, lowpass: 1300 })
        tone(c, bus, t + d, { from: 98, dur: 0.25, gain: 0.08, attack: 0.006, wet: 0.3 })
      })
      break
    case 'warp':
      // 길게 빨려 들어가는 공기 + 낮게 떨리는 음
      air(c, bus, t, { dur: 2.6, gain: 0.22, from: 120, to: 2600, peak: 0.75, wet: 0.8, q: 4 })
      tone(c, bus, t, { from: 55, to: 110, dur: 2.6, gain: 0.18, attack: 0.8, trem: [5, 14, 0.5], wet: 0.4 })
      break
    case 'glitch': {
      // 툭툭 끊기는 낮은 잡음
      const hits = [0, 0.07, 0.16, 0.2, 0.34, 0.41, 0.58]
      hits.forEach((d) => {
        air(c, bus, t + d, { dur: 0.06 + Math.random() * 0.05, gain: 0.25, from: 700, to: 300, peak: 0.1, wet: 0.3, q: 6 })
      })
      tone(c, bus, t, { type: 'square', from: 62, to: 48, dur: 0.7, gain: 0.04, attack: 0.005, trem: [22, 1], wet: 0.3, lowpass: 400 })
      break
    }
    case 'arrive':
      // 깊은 쿵 + 넓게 퍼지는 화음
      tone(c, bus, t, { from: 55, to: 41, dur: 1.6, gain: 0.32, attack: 0.01, wet: 0.4 })
      air(c, bus, t, { dur: 1.6, gain: 0.14, from: 1400, to: 120, peak: 0.06, wet: 0.9 })
      tone(c, bus, t + 0.2, { from: 165, dur: 3, gain: 0.07, attack: 0.5, detune: 6, wet: 0.95 })
      tone(c, bus, t + 0.35, { from: 247, dur: 2.8, gain: 0.05, attack: 0.6, detune: 6, wet: 1, lowpass: 1400 })
      tone(c, bus, t + 0.5, { from: 110, dur: 3, gain: 0.07, attack: 0.6, detune: 5, wet: 0.9 })
      break
    case 'receive':
      // 심장 박동 같은 낮은 펄스 세 번 (쿵-쿵 · 쉼)
      ;[0, 0.22, 1.0, 1.22, 2.0, 2.22].forEach((d, i) => {
        tone(c, bus, t + d, { from: 72, to: 52, dur: 0.32, gain: i % 2 ? 0.14 : 0.2, attack: 0.008, wet: 0.45 })
      })
      break

    /* ---- 진입 ---- */
    case 'descend':
      // 카메라가 아래로 — 공기가 가라앉으며 낮은 음이 미끄러진다
      air(c, bus, t, { dur: 1.3, gain: 0.16, from: 1500, to: 140, peak: 0.25, wet: 0.8 })
      tone(c, bus, t, { from: 196, to: 98, dur: 1.2, gain: 0.08, attack: 0.08, detune: 8, wet: 0.7, lowpass: 900 })
      tone(c, bus, t + 0.05, { from: 65, to: 49, dur: 1.1, gain: 0.14, attack: 0.15, wet: 0.3 })
      break
    case 'boot':
      // 전원이 들어오는 쿵 → 낮게 올라오는 웅 → 짧은 확인음
      tone(c, bus, t, { from: 60, to: 40, dur: 0.6, gain: 0.3, attack: 0.005, wet: 0.3 })
      tone(c, bus, t + 0.15, { from: 50, to: 75, dur: 2.2, gain: 0.16, attack: 0.6, trem: [4, 9, 0.5], wet: 0.4 })
      air(c, bus, t + 0.1, { dur: 2.2, gain: 0.08, from: 160, to: 700, peak: 0.6, wet: 0.6 })
      tone(c, bus, t + 0.7, { from: 147, dur: 0.9, gain: 0.05, attack: 0.02, detune: 6, wet: 0.8, lowpass: 1200 })
      break
  }
  return stop
}
