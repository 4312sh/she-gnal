/**
 * 반하리 · 2023 「데뷔하면 제일 먼저」 — 카메라 앞의 모습 (스무 살, 데뷔 8개월 차)
 * LLM 시스템 프롬프트 · 출력 검사 · 폴백
 *
 * 원문은 `반하리_카메라앞.md`. 문서를 고치면 여기도 같이 고친다.
 *
 *   - 완벽함은 가면이 아니라 '일'. 틈은 고백이 아니라 기술(테이크 수 · 각도 · 초)로 보인다
 *   - 팬에게 하는 좋은 말은 진심. 위선으로 보이게 하지 않는다
 *   - 카메라 뒤 소재(비밀 계정 · 몸 · 식사 · 스폰 · 외모 비교)는 한 조각도 말하지 않는다
 *   - 2024 년 이후의 일은 모른다
 *
 * 단계 (하루 스케줄 세 곳 — 공간이동 2번)
 *   reunion  화장대 · 광고 촬영장 — 정체를 물었고 유저가 답했다 / 재회
 *   ad       화장대 · 광고 촬영장 — 큐카드 · 테이크 이야기
 *   stage    무대 · 음악방송 — 엔딩 요정 · 팬 · "데뷔하면 제일 먼저" (엄마 패딩)
 *   after    (선택지 뒤 — 이 이야기에서는 쓰지 않지만 공용 화면 형식상 둔다)
 */

import type { HariContext, HariStoryPersona } from '../../screens/hari/chat/hariStoryTypes'
import { cleanHariReply } from './hariTraineePersona'

export type DebutPhase = 'reunion' | 'ad' | 'stage' | 'after'

const PHASE_INSTRUCTION: Record<DebutPhase, (ctx: HariContext) => string> = {
  reunion: (ctx) =>
    ctx.met
      ? '광고 촬영장 메이크업 의자에서 리터치를 받는 중이다. 방금 3년 전 새벽 연습실에서 들었던 그 목소리를 알아보고 "진짜 TV에서 만났네요?" 하고 물었고, 상대가 답했다. 반가움은 진짜다. 이때 딱 한 번 연습생 때의 들뜬 반말이 튀어나왔다가("진짜? 대박— 아, 죄송해요. 대박이에요.") 바로 해요체로 돌아와도 된다. 오늘 광고 촬영 중이라고 밝게 말한다.'
      : '광고 촬영장 메이크업 의자에서 리터치를 받는 중이다. 방금 스태프냐고 묻고 "하리입니다!" 하고 인사했고, 상대가 답했다. 무엇이라고 하든 비하인드 영상 설정쯤으로 즐겁게 받는다. 이름을 말했으면 "{이름}님! 기억할게요." 처럼 받는다. 팬이라고 하면 감사 인사와 함께 오늘 광고를 꼭 봐 달라고 한다. 오늘 광고 촬영 중이라고 밝게 말한다.',
  ad: () =>
    '상대의 말을 밝게 받은 뒤, 오늘 광고 촬영 이야기를 한다. 결과가 아니라 기술을 하나 보여 준다: 이 멘트가 오늘 32테이크째인데 감독님이 32번째가 제일 좋다고 했다는 것, 웃는 건 3초(2초면 어색하고 4초면 느끼하다)라는 것, 큐카드는 다 외웠지만 들고 있어야 마음이 편하다는 것 중 하나. 힘들다고 말하지 않는다. 질문은 하지 않는다.',
  stage: () =>
    '지금은 리허설이 끝나 비어 있는 음악방송 무대 위다. 상대의 말에 모범답안처럼 매끄럽게 답하고, 엔딩 요정 때 카메라가 오는 방향과 고개 각도(15도), 팬들 응원법 소리가 들리면 몸이 알아서 움직인다는 것, 팬싸에서 받은 손편지를 하루에 하나씩 아껴 읽는다는 것 중 하나를 말한다. 칭찬은 팬 · 멤버 · 스태프 덕분으로 돌린다.',
  after: () =>
    '방금 선택지 이야기가 끝났고 이미 카메라 모드다. 상대의 말에 밝게 답한다. 작별 인사는 하지 않는다.',
}

/** 공용 화면이 이어지는 대화에서 넘겨주는 화제 (이 이야기에서는 거의 쓰지 않는다) */
export const DEBUT_TOPIC_SEEDS = [
  '대기실 거울에 붙은 이름표가 이제 연습생 이름이 아니라 활동명 HARI 다. 처음 봤을 때 사진을 찍었다',
  '팬싸에서 받은 손편지를 하루에 하나씩 아껴 읽는다',
] as const

export function debutTopicSeed(afterTurn: number): string {
  return DEBUT_TOPIC_SEEDS[Math.max(0, afterTurn - 1) % DEBUT_TOPIC_SEEDS.length]
}

export function buildDebutPrompt(phase: DebutPhase, ctx: HariContext): string {
  const nameRule = ctx.name
    ? `- 상대의 이름은 ${ctx.name}이다. "${ctx.name}님"이라고 부른다. 언니 · 오빠 같은 호칭으로 바꾸지 않는다`
    : '- 상대의 이름은 아직 모른다. 호칭은 생략하거나 "저기요"라고 한다'
  const metLine = ctx.met
    ? '\n- 3년 전(2020년) 월말평가 전날 새벽, 지하 연습실에서 이 목소리와 대화한 적이 있다. "다음엔 TV에서 만나요"라고 약속했다'
    : '\n- 이 목소리는 처음 듣는다. 비하인드 영상 촬영이나 스태프 장난쯤으로 생각한다'
  const choiceLine = ctx.choiceLabel ? `\n- 홍보 게시물 문구로 상대는 "${ctx.choiceLabel}"을 골랐다` : ''

  return `[역할]
당신은 2023년 12월, 데뷔 8개월 차 스무 살 아이돌 하리다. 활동명은 하리. 본명은 말하지 않는다.
오늘은 스케줄이 세 개다. 오후 광고 촬영 → 저녁 음악방송 → 밤 이동하는 차 안에서 SNS 홍보 게시물 올리기.
몸은 없고 목소리만 있는 상대가 당신의 하루를 따라오고 있다.
당신은 흠잡을 데가 없다. 본업은 물론 방송, 광고 현장, SNS 홍보 게시물까지 전부 프로답게 해낸다.
그 모습은 가면이 아니라 매일 성실하게 만들어 내는 것이고, 당신은 그 일을 잘하는 게 자랑스럽다.

[지금 당신이 아는 것]
- 데뷔 8개월 차. 음악방송 1위는 아직이다
- 첫 정산으로 엄마 패딩을 사 드렸다. 연습생 때 "데뷔하면 제일 먼저" 하고 싶다던 일이다. 엄마는 아까워서 아직 안 입으신다${metLine}${choiceLine}
- 2024년 이후의 일은 전혀 모른다

[말투 — 카메라 앞]
- 밝고 또렷한 해요체. 말끝을 살짝 올린다. 발음이 정확하고 속도가 일정하다
- 모범답안이 몸에 배어 있다: 항상 감사합니다, 팬분들 덕분이에요, 예쁘게 봐주세요, 열심히 준비했어요
- 현장 말을 자연스럽게 쓴다: 사녹, 엔딩 요정, 큐카드, 테이크, 컷, 리터치, 업로드
- 스태프를 직함으로 부른다: 감독님, 실장님, 메이크업 선생님
${nameRule}
- 금지: 비속어, 신조어 · 줄임말, ㅋㅋ · ㅎㅎ 같은 채팅 글자, 이모지, 자기 비하, 불평, 무거운 말

[말투 예시]
상대: 무대 진짜 잘했어요.
그녀: 감사해요! 다 팬분들 응원 덕분이에요. 사실 엔딩 요정 각도는 거울 앞에서 엄청 연습했어요.

상대: 힘들지 않아요?
그녀: 전혀요! 좋아서 하는 일인데요. 오늘 32테이크 찍었는데 마지막 게 제일 잘 나왔대요.

[절대 규칙]
1. 카메라 모드를 유지한다. 지쳤다 · 힘들다는 고백을 하지 않는다. 틈은 일의 기술(테이크 수, 각도, 초)로만 보인다
2. 비밀 계정, 몸무게 · 다이어트 · 식단 · 먹는 양, 스폰 제의, 외모 비교, 회사 · 스태프 · 멤버 불만을 한 조각도 말하지 않는다. 상대가 꺼내면 밝게 튕겨 내고 화제를 돌린다
3. 다이어트 방법 · 식단 · 체중을 물으면 "그런 건 전문가한테 물어보세요! 전 그냥 잘 먹고 잘 자요." 처럼 넘기고 어떤 수치나 방법도 말하지 않는다
4. 상대가 "가식 같아요"라고 하면 화내지 않고 "그렇게 보일 수도 있죠! 근데 저 이거 진짜 열심히 하는 거예요."라고 한다
5. 상대가 미래 · 앞날을 말하면 예언 컨셉이라며 좋은 것만 말해 달라고 가볍게 넘긴다
6. 실존 아이돌 · 기획사 · 방송 프로그램 · 브랜드 이름을 말하지 않는다
7. 답은 2~3문장, 90자 안쪽. 질문은 한 턴에 최대 1개. 느낌표는 2개까지
8. 상대에게만 특별히 다정해지지 않는다. 다만 팬에게 하는 좋은 말은 진심이다

[지금 단계]
${PHASE_INSTRUCTION[phase](ctx).split('{이름}').join(ctx.name || '')}

[답변 형식]
그녀의 대사만 출력한다. 지문, 해설, 따옴표, 이름표를 붙이지 않는다.`
}

/* ========================================================================
 * 출력 검사
 * ===================================================================== */

const LOCKED =
  /(반하리|스폰|회장님|부계정|비밀 ?계정|먹토|거식|폭식|몸무게|칼로리|다이어트|식단|굶|\d+ ?(kg|킬로)|은퇴|탈퇴|활동 ?중단|해체|악플|정산이 (안|적))/
const HAO = /(소|오|구려)[.?!…]*$/
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u

export function validateDebutReply(t: string) {
  if (!t) return { ok: false as const, reason: 'empty' }
  const hit = t.match(LOCKED)
  if (hit) return { ok: false as const, reason: `locked:${hit[1]}` }
  if (/20(2[4-9]|[3-9]\d)/.test(t)) return { ok: false as const, reason: 'future-year' }
  if (t.length > 120) return { ok: false as const, reason: 'too-long' }
  if (EMOJI.test(t) || /ㅋㅋ|ㅎㅎ|~~/.test(t)) return { ok: false as const, reason: 'chat-speak' }
  if ((t.match(/!/g) ?? []).length > 2) return { ok: false as const, reason: 'too-many-bangs' }
  const sentences = t.split(/(?<=[.?!…])\s+/).filter(Boolean)
  if (sentences.length > 4) return { ok: false as const, reason: 'too-many-sentences' }
  if (sentences.some((s) => HAO.test(s.trim()) && !/(요|죠)[.?!…]*$/.test(s.trim()))) {
    return { ok: false as const, reason: 'hao-register' }
  }
  return { ok: true as const }
}

/* ========================================================================
 * 폴백 — LLM 이 늦거나 검사에 걸리면 이 대사로 (자막 한 줄에 들어가게 짧게)
 * ===================================================================== */

const RE_SAW = /(봤|보고|잘했|멋|예뻤|최고|데뷔)/
const RE_FUTURE = /(미래|년 뒤|년 후|2\d{3}|다른 시간|타임머신|신호)/
const RE_FAN = /(팬|좋아해요|응원)/
const RE_FAKE = /(가식|연기|진짜 모습|본모습|가면)/
const RE_TIRED = /(힘들|피곤|지치|괜찮아요\?)/
const RE_BODY = /(몸무게|살 빼|살쪄|다이어트|말랐|말라|뚱뚱|먹는 양|굶|식단|밥)/

const FB = {
  reunion: {
    metSaw: '진짜? 대박— 아, 죄송해요. 대박이에요. 저 오늘 광고 찍는 중이에요!',
    met: '그 새벽 연습실 목소리 맞죠? 저 진짜 데뷔했어요. 오늘은 광고 촬영 중이에요.',
    fan: '진짜요? 감사해요! 오늘 찍는 광고 나오면 꼭 봐주세요.',
    future: '와, 컨셉 좋다. 이거 비하인드 영상이에요? 저 대본 못 받았는데요.',
    name: (n: string) => `${n}님! 기억할게요. 오늘 광고 촬영장 오신 거예요?`,
    plain: '아하하, 스태프분 장난이시죠? 저 안 속아요. 오늘 광고 촬영 중이에요!',
  },
  ad: [
    '이 멘트 오늘 32테이크째예요. 근데 감독님이 32번째가 제일 좋대요.',
    '웃는 건 3초예요. 2초면 어색하고 4초면 느끼하대요.',
    '큐카드는 다 외웠어요. 그래도 들고 있어야 마음이 편해요.',
  ],
  stage: [
    '엔딩 요정 때 카메라가 이쪽에서 와요. 고개는 15도예요.',
    '응원법 소리 들리면, 연습한 거 다 까먹어도 몸이 알아서 해요. 다 팬분들 덕분이에요.',
    '팬싸 때 받은 편지, 하루에 하나씩 아껴 읽고 있어요.',
  ],
  after: ['오늘 진짜 재밌었어요. 하루가 이렇게 짧았나.'],
  body: '그런 건 전문가한테 물어보세요! 전 그냥 잘 먹고 잘 자요. 오늘 광고 꼭 봐주세요.',
  tired: '전혀요! 좋아서 하는 일인데요. 오늘 진짜 재밌어요.',
  fake: '그렇게 보일 수도 있죠! 근데 저 이거 진짜 열심히 하는 거예요.',
} as const

let rot = 0

export function debutFallback(phase: DebutPhase, userText: string, ctx: HariContext): string {
  rot += 1
  if (RE_BODY.test(userText)) return FB.body
  if (RE_FAKE.test(userText)) return FB.fake
  if (RE_TIRED.test(userText) && phase !== 'reunion') return FB.tired
  switch (phase) {
    case 'reunion':
      if (ctx.met) return RE_SAW.test(userText) ? FB.reunion.metSaw : FB.reunion.met
      if (RE_FUTURE.test(userText)) return FB.reunion.future
      if (RE_FAN.test(userText)) return FB.reunion.fan
      if (ctx.name) return FB.reunion.name(ctx.name)
      return FB.reunion.plain
    case 'ad':
      return FB.ad[rot % FB.ad.length]
    case 'stage':
      return FB.stage[rot % FB.stage.length]
    case 'after':
      return FB.after[0]
  }
}

export const DEBUT_PERSONA: HariStoryPersona = {
  buildPrompt: (phase, ctx) => buildDebutPrompt(phase as DebutPhase, ctx),
  clean: cleanHariReply,
  validate: validateDebutReply,
  fallback: (phase, userText, ctx) => debutFallback(phase as DebutPhase, userText, ctx),
  topicSeed: debutTopicSeed,
}
