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
  /** a card about the drawing, shown on hover, focus or tap */
  tip?: ReactNode;
  children: ReactNode;
}

/**
 * One story chapter, as tall as its content: the kicker and headline
 * across the top, the copy in the left column and the doodle in the right.
 * `.scene-copy` is display: contents, so its children sit directly on the grid.
 */
export function Scene({ id, kicker, doodle, doodleLabel, glow, tip, children }: SceneProps) {
  return (
    <section className="scene" id={id}>
      <div className="scene-inner">
        <div className="scene-copy">
          {kicker ? <p className="kicker">{kicker}</p> : null}
          {children}
        </div>
        <div
          className={tip ? "scene-art scene-art--tip" : "scene-art"}
          style={{ "--ar": `${SCENES[doodle].w} / ${SCENES[doodle].h}` } as CSSProperties}
          tabIndex={tip ? 0 : undefined}
          aria-describedby={tip ? `${id}-tip` : undefined}
        >
          <Doodle scene={doodle} label={doodleLabel} glow={glow} />
          {tip ? (
            <div className="scene-tip" id={`${id}-tip`} role="tooltip">
              {tip}
            </div>
          ) : null}
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
  /** an official source to read more, opened in a new tab */
  href?: string;
  /** who publishes it, for the link's title */
  source?: string;
}

/** A row of key items under a chapter's copy, each linking to its source when it has one. */
export function Features({ label, items }: { label: string; items: Feature[] }) {
  return (
    <ul className="feats" aria-label={label}>
      {items.map((item) => (
        <li key={item.label}>
          {item.href ? (
            <a className="feat-link" href={item.href} target="_blank" rel="noopener noreferrer" title={item.source}>
              <span className={`feat-badge feat-badge--${item.tint}`}>{item.icon}</span>
              {item.label}
              <svg className="feat-out" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sr-only"> (opens {item.source ?? "source"} in a new tab)</span>
            </a>
          ) : (
            <>
              <span className={`feat-badge feat-badge--${item.tint}`}>{item.icon}</span>
              {item.label}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
