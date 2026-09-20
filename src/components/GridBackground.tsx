/**
 * Dashed grid shared by every screen (Figma 1920×1080 frames: vertical lines
 * every 84.672px from x = -141.03, horizontal every 73.68px from y = -417.6).
 * Drawn as an SVG pattern that bleeds far past the artboard so wider or taller
 * monitors stay covered and the lines stay aligned with the Figma frame.
 */
const BLEED = 4000

export function GridBackground({ hidden = false }: { hidden?: boolean }) {
  return (
    <svg
      className="grid-background"
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      overflow="visible"
      aria-hidden
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <defs>
        <pattern id="grid-v" patternUnits="userSpaceOnUse" x={-142.03} y={0} width={84.672} height={10.88}>
          <line x1={1} y1={0} x2={1} y2={5.44} stroke="#7c7c7c" strokeWidth={0.5} />
        </pattern>
        <pattern id="grid-h" patternUnits="userSpaceOnUse" x={0} y={-418.6} width={10.88} height={73.68}>
          <line x1={0} y1={1} x2={5.44} y2={1} stroke="#7c7c7c" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect x={-BLEED} y={-BLEED} width={1920 + BLEED * 2} height={1080 + BLEED * 2} fill="url(#grid-v)" />
      <rect x={-BLEED} y={-BLEED} width={1920 + BLEED * 2} height={1080 + BLEED * 2} fill="url(#grid-h)" />
    </svg>
  )
}
