import type { ReactNode } from "react";
import { Doodle } from "../ink/Doodle";
import type { SceneName } from "../ink/scenes";

interface SceneProps {
  id: string;
  kicker?: ReactNode;
  /** the doodle drawn beside the copy */
  doodle: SceneName;
  doodleLabel: string;
  glow?: boolean;
  children: ReactNode;
}

/**
 * One story chapter, as tall as its content: the kicker and headline
 * across the top, the copy in the left column and the doodle in the right.
 * `.scene-copy` is display: contents, so its children sit directly on the grid.
 */
export function Scene({ id, kicker, doodle, doodleLabel, glow, children }: SceneProps) {
  return (
    <section className="scene" id={id}>
      <div className="scene-inner">
        <div className="scene-copy">
          {kicker ? <p className="kicker">{kicker}</p> : null}
          {children}
        </div>
        <div className="scene-art">
          <Doodle scene={doodle} label={doodleLabel} glow={glow} />
        </div>
      </div>
    </section>
  );
}

/** The outlined "learn more" pills under a chapter. */
export function LearnMore({ links }: { links: [label: string, href: string][] }) {
  return (
    <ul className="pills pills--links" aria-label="Learn more">
      {links.map(([label, href]) => (
        <li key={href}>
          {/* one text node: two would break the hover underline before the arrow */}
          <a href={href} target="_blank" rel="noreferrer">
            {`${label} ↗`}
          </a>
        </li>
      ))}
    </ul>
  );
}
