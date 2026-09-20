import decor from '../assets/rules/decor.svg'
import './HowToPlay.css'

type Props = {
  onNext: () => void
}

/** Figma: "how to play" (743:33561) */
export function HowToPlay({ onNext }: Props) {
  return (
    <div className="how-to-play" data-node-id="743:33561">
      <img className="layer how-to-play__decor" src={decor} alt="" />

      <h1 className="how-to-play__title">She-gNAL: Tune Into Her Era — Game Rules</h1>

      <div className="panel how-to-play__panel" />
      <p className="how-to-play__body">
        Through a Signal that travels across time,
        <br />
        you speak with women who lived in different eras.
        <br />
        Answering the signals they send from the past, present,
        <br />
        and future, you experience the emotions and social structures of
        <br />
        each era firsthand in this narrative dialogue game.
      </p>

      <button type="button" className="pill how-to-play__next" onClick={onNext}>
        next
      </button>
    </div>
  )
}
