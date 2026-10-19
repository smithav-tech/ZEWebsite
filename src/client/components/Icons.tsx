/** Small line icons, drawn in currentColor. Decorative: the text beside them carries the meaning. */

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** The arrow inside the flat call-to-action buttons. */
export function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" strokeWidth="2" {...base}>
      <path d="M2 7h10M8 3l4 4-4 4" />
    </svg>
  );
}

/** A house, for "Back to Home". */
export function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" strokeWidth="2" {...base}>
      <path d="M1.5 6.5 7 2l5.5 4.5" />
      <path d="M3 5.5V12h8V5.5" />
      <path d="M5.75 12V8.75h2.5V12" />
    </svg>
  );
}

/** Feed bowl (TMR). */
export function BowlIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" strokeWidth="1.8" {...base}>
      <path d="M3 11h18" />
      <path d="M4 11a8 8 0 0 0 16 0" />
      <path d="M8 7.5c.8-1.5 2.2-1.5 3 0M13 6.5c.8-1.5 2.2-1.5 3 0" />
    </svg>
  );
}

/** Grass blades (fodder). */
export function GrassIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" strokeWidth="1.8" {...base}>
      <path d="M3 20h18" />
      <path d="M6 20c0-6 1.5-10 4.5-13" />
      <path d="M12 20c0-5-1-9-3.5-12" />
      <path d="M12 20c0-6 2-11 6-14" />
    </svg>
  );
}

/** Milk drop (animal productivity). */
export function DropIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" strokeWidth="1.8" {...base}>
      <path d="M12 3c3.5 4.5 6 7.7 6 10.5a6 6 0 0 1-12 0C6 10.7 8.5 7.5 12 3Z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </svg>
  );
}

/** Flame (CBG). */
export function FlameIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" strokeWidth="1.8" {...base}>
      <path d="M12 21a6 6 0 0 0 6-6c0-3.5-2.5-5.5-3.5-8.5-1.5 1.5-2 3-2 4.5-1-.8-1.5-2-1.5-3.5C8 9.5 6 12 6 15a6 6 0 0 0 6 6Z" />
    </svg>
  );
}

/** Tank with a frost mark (liquefied bio-LNG). */
export function TankIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" strokeWidth="1.8" {...base}>
      <rect x="7" y="4.5" width="10" height="16.5" rx="3" />
      <path d="M10 4.5V2.5h4v2" />
      <path d="M12 9.5v6M9.4 11l5.2 3M14.6 11l-5.2 3" />
    </svg>
  );
}
