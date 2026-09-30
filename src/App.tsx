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
import { formatNow, nearestEra, type TargetTime } from './game/eras'
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

function App() {
  // 개발용: 주소 뒤에 ?screen=dashboard 처럼 붙이면 해당 화면부터 시작
  const [nav, setNav] = useState<{ screen: ScreenId; kind: TransitionKind }>(() => ({
    screen: (params.get('screen') as ScreenId) || 'title',
    kind: 'slide',
  }))
  const go = useCallback((screen: ScreenId, kind: TransitionKind = 'slide') => setNav({ screen, kind }), [])
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
        return <OpeningTitle onStart={() => go('enterName')} />
      case 'enterName':
        return (
          <EnterName
            initialName={player.name}
            initialAge={player.age}
            onSubmit={(name, age) => {
              updatePlayer({ name, age })
              go('chooseGender')
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
        return player.target ? <TimeReady target={player.target} onDone={() => go('signal1', 'ascii')} /> : null
      case 'signal1':
        return <Signal1 onNext={() => go('signal2', 'ascii')} />
      case 'signal2':
        return <Signal2 onNext={() => go('signal3', 'ascii')} />
      case 'signal3': {
        const era = nearestEra(player.target?.year ?? 1935)
        return (
          <Signal3
            era={era}
            onNext={() => {
              updatePlayer({
                lastPlayed: { eraId: era.id, chapter: 0, at: formatNow() },
              })
              go('prologue', 'crt')
            }}
          />
        )
      }
      case 'prologue':
        return (
          <PrologueFlow
            startAt={prologueStep}
            chatStartAt={prologueChatStage}
            onComplete={() => go('character', 'crt')}
            onExit={() => go('dashboard', 'fade')}
          />
        )
      case 'character':
        return (
          <CharacterScreen
            ch1={player.chapter1}
            lastPlayedAt={player.lastPlayed?.at}
            onEnterChapter1={() => go('chapter1', 'crt')}
            onBack={() => go('dashboard', 'fade')}
          />
        )
      case 'chapter1':
        return (
          <Chapter1Flow
            playerName={player.name ?? ''}
            save={player.chapter1}
            onSave={(chapter1) => updatePlayer({ chapter1 })}
            onExit={() => go('character', 'fade')}
            startAt={nav.screen === params.get('screen') ? ch1Step : undefined}
            sceneAt={nav.screen === params.get('screen') ? ch1SceneAt : undefined}
          />
        )
    }
  }

  return (
    <Stage tone={nav.screen === 'boot' ? 'black' : 'grid'}>
      <GridBackground hidden={nav.screen === 'boot'} />
      <ScreenTransition screen={nav.screen} kind={nav.kind} render={render} />
    </Stage>
  )
}

export default App
