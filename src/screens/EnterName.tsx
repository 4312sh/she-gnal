import { useEffect, useRef, useState, type FormEvent } from 'react'
import lines from '../assets/name/lines.svg'
import expand from '../assets/name/expand.svg'
import sphere from '../assets/name/sphere.svg'
import sphereLarge from '../assets/name/sphere-large.svg'
import './EnterName.css'
import { playSfx } from '../game/sfx'

type Props = {
  initialName?: string
  initialAge?: number
  onSubmit: (name: string, age: number) => void
}

const EXPAND_MS = 1000

/** Figma: "enter name" (1463:4932) → "enter name - 2" (1463:8915) */
export function EnterName({ initialName = '', initialAge, onSubmit }: Props) {
  const [name, setName] = useState(initialName)
  const [age, setAge] = useState(initialAge ? String(initialAge) : '')
  const [submitted, setSubmitted] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  // Focus after the camera move finishes (autoFocus would scroll the stage mid-transition)
  useEffect(() => {
    const t = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 1100)
    return () => window.clearTimeout(t)
  }, [])

  const ageNum = Number(age)
  const valid = name.trim().length > 0 && Number.isInteger(ageNum) && ageNum > 0 && ageNum < 130

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!valid || submitted) return
    setSubmitted(true)
    playSfx('confirm')
    window.setTimeout(() => {
      playSfx('descend')
      onSubmit(name.trim(), ageNum)
    }, EXPAND_MS)
  }

  return (
    <form
      className={`enter-name${submitted ? ' is-submitted' : ''}`}
      onSubmit={handleSubmit}
 data-node-id="1463:4932">
      <img className="layer enter-name__lines" src={lines} alt="" />
      <img className="layer enter-name__expand" src={expand} alt="" />

      {/* Figma "Component 46" (1468:12849 → 1468:12840): 600×400 glass panel, content centred */}
      <div className="panel enter-name__panel">
        <h1 className="enter-name__heading">Enter your name &amp; age</h1>
        <div className="enter-name__fields">
          <input
            className="enter-name__field"
            type="text"
            placeholder="name"
            aria-label="이름"
            autoComplete="off"
            maxLength={16}
            value={name}
            onChange={(e) => {
              playSfx(e.target.value.length < name.length ? 'erase' : 'key')
              setName(e.target.value)
            }}
            disabled={submitted}
            ref={nameRef}
          />
          <input
            className="enter-name__field"
            type="text"
            inputMode="numeric"
            placeholder="Age"
            aria-label="나이"
            autoComplete="off"
            maxLength={3}
            value={age}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              if (v !== age) playSfx(v.length < age.length ? 'erase' : 'key', { pitch: 4 })
              setAge(v)
            }}
            disabled={submitted}
          />
        </div>
      </div>

      <button
        type="submit"
        className="enter-name__sphere"
        disabled={!valid}
        onPointerEnter={() => valid && !submitted && playSfx('hover')}
        aria-label="입력 완료"
        title={valid ? '다음으로' : '이름과 나이를 입력해 주세요'}
      >
        <img src={sphere} alt="" className="enter-name__sphere-small" />
        <img src={sphereLarge} alt="" className="enter-name__sphere-large" />
      </button>
    </form>
  )
}
