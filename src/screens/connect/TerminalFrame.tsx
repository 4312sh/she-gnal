import type { ReactNode } from 'react'
import './Connect.css'

type Props = {
  nodeId: string
  onClick: () => void
  label: string
  children: ReactNode
}

/** Full-stage terminal screen (Figma "background 1/2/3", 1920×1080): glass panel + art + typing. */
export function TerminalFrame({ nodeId, onClick, label, children }: Props) {
  return (
    <button type="button" className="terminal" onClick={onClick} aria-label={label} data-node-id={nodeId}>
      <div className="term-panel" />
      {children}
    </button>
  )
}
