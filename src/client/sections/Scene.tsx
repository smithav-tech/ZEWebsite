import type { CSSProperties, ReactNode } from "react";
import { Doodle } from "../ink/Doodle";
import { SCENES, type SceneName } from "../ink/scenes";

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
        <div className="scene-art" style={{ "--ar": `${SCENES[doodle].w} / ${SCENES[doodle].h}` } as CSSProperties}>
          <Doodle scene={doodle} label={doodleLabel} glow={glow} />
        </div>
      </div>
    </section>
  );
}

/** One item in a chapter's icon row: a tinted badge with a line icon, then the label. */
export interface Feature {
  label: string;
  icon: ReactNode;
  tint: "lime" | "teal" | "purple";
}

/** A row of key items under a chapter's copy: plain items, not links. */
export function Features({ label, items }: { label: string; items: Feature[] }) {
  return (
    <ul className="feats" aria-label={label}>
      {items.map((item) => (
        <li key={item.label}>
          <span className={`feat-badge feat-badge--${item.tint}`}>{item.icon}</span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
