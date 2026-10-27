import { useState } from 'react'
import line from '../assets/gender/line.svg'
import orbit from '../assets/gender/orbit.svg'
import orbitSelected from '../assets/gender/orbit-selected.svg'
import type { Gender } from '../game/types'
import './ChooseGender.css'
import { playSfx } from '../game/sfx'

type Props = {
  onSelect: (gender: Gender) => void
}

const CONFIRM_MS = 1400

/** Figma: "choose gender" (1463:7309) → "choose gender 2" (1463:7717) */
export function ChooseGender({ onSelect }: Props) {
  const [selected, setSelected] = useState<Gender | null>(null)

  const choose = (g: Gender) => {
    if (selected) return
    playSfx('lock')
    setSelected(g)
    window.setTimeout(() => onSelect(g), CONFIRM_MS)
  }

  const optionClass = (g: Gender) =>
    ['choose-gender__option', `choose-gender__option--${g}`, selected === g && 'is-active'].filter(Boolean).join(' ')

  return (
    <div className={`choose-gender${selected ? ' has-selection' : ''}`} data-node-id="1463:7309">
      <img className="layer choose-gender__line" src={line} alt="" />

      {/* Figma "Component 46" (1468:12877): 600×400 glass panel, two options side by side */}
      <div className="panel choose-gender__panel">
        <h1 className="choose-gender__heading">your Gender type?</h1>
        <div className="choose-gender__options">
          <button
            type="button"
            className={optionClass('woman')}
            onClick={() => choose('woman')}
            onPointerEnter={() => !selected && playSfx('hover')}
            aria-pressed={selected === 'woman'}
          >
            WOman
          </button>
          <button
            type="button"
            className={optionClass('man')}
            onClick={() => choose('man')}
            onPointerEnter={() => !selected && playSfx('hover')}
            aria-pressed={selected === 'man'}
          >
            man
          </button>
        </div>
      </div>

      <div className="choose-gender__orbit">
        <img className="layer choose-gender__orbit-idle" src={orbit} alt="" />
        <img className="layer choose-gender__orbit-selected" src={orbitSelected} alt="" />
      </div>
    </div>
  )
}
