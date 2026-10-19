import type { SceneName } from "./scenes";

interface DoodleProps {
  scene: SceneName;
  /** what the drawing shows, for screen readers */
  label: string;
  className?: string;
  /** the hero cow: drawn by pointer travel and the first scroll, not by position */
  interactive?: boolean;
  /** a soft pulsing halo once the scene is complete */
  glow?: boolean;
}

/**
 * An empty, sized box the ink line draws a scene into. InkLine finds every
 * `.doodle-box` in document order and reads these data attributes; the
 * drawing itself lives in the page-wide SVGs, so one stroke can run between
 * the boxes.
 */
export function Doodle({ scene, label, className = "", interactive = false, glow = false }: DoodleProps) {
  return (
    <div
      className={`doodle-box ${className}`}
      data-scene={scene}
      data-interactive={interactive ? "1" : undefined}
      data-glow={glow ? "1" : undefined}
      role="img"
      aria-label={label}
    />
  );
}
