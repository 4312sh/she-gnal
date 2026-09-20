import { useState } from 'react'
import line from '../assets/gender/line.svg'
import orbit from '../assets/gender/orbit.svg'
import orbitSelected from '../assets/gender/orbit-selected.svg'
import type { Gender } from '../game/types'
import './ChooseGender.css'

type Props = {
  onSelect: (gender: Gender) => void
}

const CONFIRM_MS = 1400

/** Figma: "choose gender" (743:32361) → "choose gender 2" (743:32961) */
export function ChooseGender({ onSelect }: Props) {
  const [selected, setSelected] = useState<Gender | null>(null)

  const choose = (g: Gender) => {
    if (selected) return
    setSelected(g)
    window.setTimeout(() => onSelect(g), CONFIRM_MS)
  }

  const optionClass = (g: Gender) =>
    [
      'pill',
      'choose-gender__option',
      `choose-gender__option--${g}`,
      selected === g && 'is-active',
      selected && selected !== g && 'is-dimmed',
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <div className={`choose-gender${selected ? ' has-selection' : ''}`} data-node-id="743:32361">
      <img className="layer choose-gender__line" src={line} alt="" />

      <div className="panel choose-gender__panel" />
      <h1 className="choose-gender__heading">choose your Gender type</h1>

      <button
        type="button"
        className={optionClass('woman')}
        style={{ top: 469 }}
        onClick={() => choose('woman')}
        aria-pressed={selected === 'woman'}
      >
        WOman
      </button>
      <button
        type="button"
        className={optionClass('man')}
        style={{ top: 577 }}
        onClick={() => choose('man')}
        aria-pressed={selected === 'man'}
      >
        man
      </button>

      <div className="choose-gender__orbit">
        <img className="layer choose-gender__orbit-idle" src={orbit} alt="" />
        <img className="layer choose-gender__orbit-selected" src={orbitSelected} alt="" />
      </div>
    </div>
  )
}
