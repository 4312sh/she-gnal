import { useCallback, useState } from 'react'
import { Stage } from './components/Stage'
import { GridBackground } from './components/GridBackground'
import { ScreenTransition, type TransitionKind } from './components/ScreenTransition'
import { OpeningTitle } from './screens/OpeningTitle'
import { EnterName } from './screens/EnterName'
import { ChooseGender } from './screens/ChooseGender'
import { HowToPlay } from './screens/HowToPlay'
import { BootLoader } from './screens/BootLoader'
import { Background1, Background2, Background3 } from './screens/connect/ConnectScreens'
import { MainDashboard } from './screens/dashboard/MainDashboard'
import { TimeSetup } from './screens/dashboard/TimeSetup'
import { TimeReady } from './screens/dashboard/TimeReady'
import { Signal1, Signal2, Signal3 } from './screens/signal/SignalScreens'
import PrologueFlow, { type ChatStage, type PrologueStep } from './screens/prologue/PrologueFlow'
import Chapter1Flow, { type Ch1Step } from './screens/chapter1/Chapter1Flow'
import type { Ch1Start } from './screens/chapter1/Chapter1Chat'
import { CharacterScreen } from './screens/character/CharacterScreen'
import { HariCharacterScreen } from './screens/hari/HariCharacterScreen'
import { EioCharacterScreen } from './screens/eio/EioCharacterScreen'
import EioPrologueChat, { type EioPrologueStart } from './screens/eio/chat/EioPrologueChat'
import { ViewCharacterScreen } from './screens/viewCharacter/ViewCharacterScreen'
import HariTraineeChat, { type TraineeStart } from './screens/hari/trainee/HariTraineeChat'
import HariBackstageChat from './screens/hari/backstage/HariBackstageChat'
import HariDebutChat from './screens/hari/debut/HariDebutChat'
import HariPrologueChat, { type HariPrologueStart } from './screens/hari/prologue/HariPrologueChat'
import Chapter2Flow, { type Ch2Step } from './screens/chapter2/Chapter2Flow'
import type { Ch2Start } from './screens/chapter2/Chapter2Chat'
import { formatNow, nearestEra, type TargetTime } from './game/eras'
import { destinationFor, nearestDestination } from './game/destinations'
import { loadPlayer, savePlayer } from './game/storage'
import type { Player, ScreenId } from './game/types'

// 개발용: ?screen=prologue&at=chat.identity 처럼 세부 단계를 지정한다
const params = new URLSearchParams(window.location.search)
const at = params.get('at') ?? ''
const prologueStep = (at.split('.')[0] || undefined) as PrologueStep | undefined
const prologueChatStage = (at.split('.')[1] || undefined) as ChatStage | undefined
// 개발용: ?screen=chapter1&at=scene.chat 처럼 (tuning | title | scene) . (opening | chat | choice | after)
const ch1Step = (at.split('.')[0] || undefined) as Ch1Step | undefined
const ch1SceneAt = (at.split('.')[1] || undefined) as Ch1Start | undefined
const ch2Step = (at.split('.')[0] || undefined) as Ch2Step | undefined
const ch2SceneAt = (at.split('.')[1] || undefined) as Ch2Start | undefined
// 개발용: ?screen=hariTrainee&at=chat (opening | chat | choice | after) — hariDebut 도 같고, &met=1 이면 재회 대사
const hariAt = (at || undefined) as TraineeStart | undefined
// 개발용: ?screen=hariPrologue&at=chat (opening | chat | stage | choice | after)
const hariPrologueAt = (at || undefined) as HariPrologueStart | undefined
// 개발용: ?screen=eioPrologue&at=chat (opening | chat | studio | choice | after)
const eioAt = (at || undefined) as EioPrologueStart | undefined

function App() {
  // 개발용: 주소 뒤에 ?screen=dashboard 처럼 붙이면 해당 화면부터 시작
  const [nav, setNav] = useState<{ screen: ScreenId; kind: TransitionKind; distance?: number }>(() => ({
    screen: (params.get('screen') as ScreenId) || 'title',
    kind: 'slide',
  }))
  const go = useCallback(
    (screen: ScreenId, kind: TransitionKind = 'slide', distance?: number) => setNav({ screen, kind, distance }),
    [],
  )
  const [rulesFromDashboard, setRulesFromDashboard] = useState(false)
  const [player, setPlayer] = useState<Partial<Player>>(() => loadPlayer() ?? {})

  const updatePlayer = useCallback((patch: Partial<Player>) => {
    setPlayer((p) => {
      const next = { ...p, ...patch }
      savePlayer(next)
      return next
    })
  }, [])

  const render = (id: ScreenId) => {
    switch (id) {
      case 'title':
        // 타이틀 아래 브래킷 선(y 1063)이 이름 화면의 선(y 27)으로 이어지도록 1036px 이동 (Figma 1463:4932)
        return <OpeningTitle onStart={() => go('enterName', 'slide', 1036)} />
      case 'enterName':
        return (
          <EnterName
            initialName={player.name}
            initialAge={player.age}
            onSubmit={(name, age) => {
              updatePlayer({ name, age })
              // 이름 화면 아래 화살표(y 1246)가 성별 화면 위 선(y 0)으로 이어지도록 (Figma 1463:8915)
              go('chooseGender', 'slide', 1246)
            }}
          />
        )
      case 'chooseGender':
        return (
          <ChooseGender
            onSelect={(gender) => {
              updatePlayer({ gender })
              go('howToPlay')
            }}
          />
        )
      case 'howToPlay':
        return (
          <HowToPlay
            onNext={() => {
              if (rulesFromDashboard) {
                setRulesFromDashboard(false)
                go('dashboard', 'fade')
              } else go('boot', 'crt')
            }}
          />
        )
      case 'boot':
        return <BootLoader onDone={() => go('bg1', 'crt')} />
      case 'bg1':
        return <Background1 onNext={() => go('bg2', 'fade')} />
      case 'bg2':
        return <Background2 onNext={() => go('bg3', 'fade')} />
      case 'bg3':
        return <Background3 onNext={() => go('dashboard', 'crt')} />
      case 'dashboard':
        return (
          <MainDashboard
            player={player}
            onConnect={() => go('timeSetup', 'fade')}
            onViewCharacter={() => go('viewCharacter', 'fade')}
            onRename={(name) => updatePlayer({ name })}
            onGameRule={() => {
              setRulesFromDashboard(true)
              go('howToPlay', 'fade')
            }}
          />
        )
      case 'timeSetup':
        return (
          <TimeSetup
            initial={player.target}
            onBack={() => go('dashboard', 'fade')}
            onGo={(target: TargetTime) => {
              updatePlayer({ target, eraId: nearestEra(target.year).id })
              go('timeReady', 'fade')
            }}
          />
        )
      case 'timeReady':
        return player.target ? <TimeReady target={player.target} onDone={() => go('signal1', 'fade')} /> : null
      case 'signal1':
        return <Signal1 onNext={() => go('signal2', 'fade')} />
      case 'signal2':
        return <Signal2 onNext={() => go('signal3', 'fade')} />
      case 'signal3': {
        // 타임머신에 친 연도의 채팅으로 (TimeSetup 에서 이미 갈 수 있는 연도로 맞춰 둔다)
        const year = player.target?.year ?? 1935
        const dest = destinationFor(year) ?? nearestDestination(year)
        const era = nearestEra(dest.year)
        return (
          <Signal3
            era={era}
            year={dest.year}
            onNext={() => {
              updatePlayer({
                lastPlayed: { eraId: dest.eraId, chapter: dest.chapter, at: formatNow(), year: dest.year },
                ...(dest.lastChapter ? { lastChapter: dest.lastChapter } : {}),
              })
              go(dest.screen, 'crt')
            }}
          />
        )
      }
      case 'prologue':
        return (
          <PrologueFlow
            startAt={prologueStep}
            chatStartAt={prologueChatStage}
            onComplete={() => go('viewCharacter', 'crt')}
            onExit={() => go('viewCharacter', 'fade')}
            onMain={() => go('dashboard', 'fade')}
          />
        )
      case 'character':
        return (
          <CharacterScreen
            ch1={player.chapter1}
            ch2={player.chapter2}
            lastChapter={player.lastChapter}
            lastPlayedAt={player.lastPlayed?.at}
            onEnterChapter={(id) => {
              updatePlayer({ lastChapter: id })
              go(id === 'ch1' ? 'chapter1' : 'chapter2', 'crt')
            }}
            onBack={() => go('dashboard', 'fade')}
          />
        )
      case 'chapter1':
        return (
          <Chapter1Flow
            playerName={player.name ?? ''}
            save={player.chapter1}
            onSave={(chapter1) => updatePlayer({ chapter1 })}
            onExit={() => go('viewCharacter', 'fade')}
            onMain={() => go('dashboard', 'fade')}
            startAt={nav.screen === params.get('screen') ? ch1Step : undefined}
            sceneAt={nav.screen === params.get('screen') ? ch1SceneAt : undefined}
          />
        )
      case 'hariCharacter':
        // 반하리 · 캐릭터 화면 (About her · SNS). 대화가 있는 스토리는 2026(공연장 뒷편의 대기실) · 2020 · 2023
        // 2023 은 2020 에서 하리와 한 번이라도 대화하면 열린다 (Figma "2020 대화 시 해금")
        return (
          <HariCharacterScreen
            lastAt={player.hariBackstage?.lastAt ?? player.hariDebut?.lastAt ?? player.hariTrainee?.lastAt ?? player.hariPrologue?.lastAt}
            unlocked={[
              'prologue',
              '2020',
              ...(player.hariTrainee ? (['2023'] as const) : []),
              ...(player.hariDebut ? (['2024'] as const) : []),
            ]}
            playable={['prologue', '2020', '2023', '2024']}
            onEnterStory={(id) => {
              if (id === 'prologue') go('hariPrologue', 'crt')
              else if (id === '2020') go('hariTrainee', 'crt')
              else if (id === '2023') go('hariDebut', 'crt')
              else if (id === '2024') go('hariBackstage', 'crt')
            }}
            onBack={() => go('dashboard', 'fade')}
          />
        )
      case 'hariTrainee':
        // 반하리 · 2020 독기 충만 연습생 (Figma 1200:13671 / 13761 / 13801)
        return (
          <HariTraineeChat
            playerName={player.name ?? ''}
            save={player.hariTrainee}
            onSave={(hariTrainee) => updatePlayer({ hariTrainee })}
            onExit={() => go('viewCharacter', 'fade')}
            onMain={() => go('dashboard', 'fade')}
            startAt={nav.screen === params.get('screen') ? hariAt : undefined}
          />
        )
      case 'hariPrologue':
        // 반하리 · 2026 스토리 공연장 뒷편의 대기실 (Figma 1373:41149 ~ 1508:14710, 3차 디자인)
        return (
          <HariPrologueChat
            playerName={player.name ?? ''}
            save={player.hariPrologue}
            onSave={(hariPrologue) => updatePlayer({ hariPrologue })}
            onExit={() => go('viewCharacter', 'fade')}
            onMain={() => go('dashboard', 'fade')}
            startAt={nav.screen === params.get('screen') ? hariPrologueAt : undefined}
          />
        )
      case 'hariDebut':
        // 반하리 · 2023 데뷔하면 제일 먼저 — 2020 화면과 같은 배치. 2020 을 끝까지 봤으면 재회로 시작
        return (
          <HariDebutChat
            playerName={player.name ?? ''}
            save={player.hariDebut}
            onSave={(hariDebut) => updatePlayer({ hariDebut })}
            onExit={() => go('viewCharacter', 'fade')}
            onMain={() => go('dashboard', 'fade')}
            met={Boolean(player.hariTrainee?.done) || params.get('met') === '1'}
            startAt={nav.screen === params.get('screen') ? hariAt : undefined}
          />
        )
      case 'hariBackstage':
        // 반하리 · 2024 새벽 3시, 편의점 앞 — 카메라 뒤. 2023 에서 대화하면 열린다
        return (
          <HariBackstageChat
            playerName={player.name ?? ''}
            save={player.hariBackstage}
            onSave={(hariBackstage) => updatePlayer({ hariBackstage })}
            onExit={() => go('viewCharacter', 'fade')}
            onMain={() => go('dashboard', 'fade')}
            met={Boolean(player.hariDebut?.done || player.hariTrainee?.done) || params.get('met') === '1'}
            startAt={nav.screen === params.get('screen') ? hariAt : undefined}
          />
        )
      case 'viewCharacter':
        // View charactor (Figma 1288:33279 기본 셋팅) — 대시보드 VIEW CHARACTOR 에서 들어온다
        return <ViewCharacterScreen player={player} onGoMain={() => go('dashboard', 'fade')} />
      case 'eioCharacter':
        // 이오 · 캐릭터 화면 (Figma 1169:9679 / 9569 / 9630 / 10250)
        return (
          <EioCharacterScreen
            lastAt={player.eioPrologue?.lastAt}
            onEnterStory={(id) => id === 'prologue' && go('eioPrologue', 'crt')}
            onBack={() => go('dashboard', 'fade')}
          />
        )
      case 'eioPrologue':
        // 이오 · 프롤로그 「고대 신호」 (Figma 1492:14550 · 1373:41123 · 1359:39986 · 1359:40041 · 1359:40068 · 1563:20530 · 1564:20557)
        return (
          <EioPrologueChat
            playerName={player.name ?? ''}
            save={player.eioPrologue}
            onSave={(eioPrologue) => updatePlayer({ eioPrologue })}
            onExit={() => go('viewCharacter', 'fade')}
            onMain={() => go('dashboard', 'fade')}
            startAt={nav.screen === params.get('screen') ? eioAt : undefined}
          />
        )
      case 'chapter2':
        return (
          <Chapter2Flow
            ch1={{
              done: Boolean(player.chapter1?.nameShared),
              name: player.chapter1?.sharedName,
              choice: player.chapter1?.choice,
            }}
            save={player.chapter2}
            onSave={(chapter2) => updatePlayer({ chapter2 })}
            onExit={() => go('viewCharacter', 'fade')}
            onMain={() => go('dashboard', 'fade')}
            startAt={nav.screen === params.get('screen') ? ch2Step : undefined}
            sceneAt={nav.screen === params.get('screen') ? ch2SceneAt : undefined}
          />
        )
    }
  }

  return (
    <Stage tone={nav.screen === 'boot' ? 'black' : 'grid'}>
      <GridBackground hidden={nav.screen === 'boot'} />
      <ScreenTransition screen={nav.screen} kind={nav.kind} distance={nav.distance} render={render} />
    </Stage>
  )
}

export default App
