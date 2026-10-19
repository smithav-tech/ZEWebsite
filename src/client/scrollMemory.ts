/**
 * A refresh keeps your place. main.tsx turns the browser's own scroll
 * restoration off (a first visit opens at the top, under the loader), so the
 * position is kept here instead: saved as the page goes away, and put back
 * when the next load of the same page is a reload. Anything else (a new
 * visit, a link, Back into the site) starts as before.
 */

const KEY = "ze:scroll";

interface Saved {
  path: string;
  y: number;
}

function read(): Saved | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as Saved | null;
    return saved && typeof saved.y === "number" ? saved : null;
  } catch {
    return null;
  }
}

const navigation = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
const saved = navigation?.type === "reload" ? read() : null;
/** where this reload should land, if anywhere below the top */
let pending: number | null = saved && saved.path === location.pathname && saved.y > 0 ? saved.y : null;

/** this load is a reload that will be put back where it was (so the loader, which opens at the top, is skipped) */
export const restoringScroll = pending !== null;
/** a restore is under way (it keeps setting the position for a moment) */
let active = false;

window.addEventListener("pagehide", () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path: location.pathname, y: Math.round(window.scrollY) } satisfies Saved));
  } catch {
    // storage blocked: a reload just opens at the top
  }
});

/**
 * Puts a reload back where it was. The layout keeps settling for a moment
 * (fonts, the ink line and the boards measuring), so the position is set again
 * a few times, until the reader scrolls for themselves. Returns false when
 * there is nothing to restore (true while a restore is still settling, so a
 * second call, as React's dev double-mount makes, does not jump to the top).
 */
export function restoreScroll(): boolean {
  if (pending === null) return active;
  const y = pending;
  pending = null;
  active = true;
  let moved = false;
  const stop = () => (moved = true);
  const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  for (const e of events) window.addEventListener(e, stop, { once: true, passive: true });
  const go = () => {
    if (!moved) window.scrollTo({ top: y, left: 0, behavior: "instant" });
  };
  go();
  requestAnimationFrame(() => requestAnimationFrame(go));
  document.fonts?.ready.then(() => requestAnimationFrame(go));
  window.setTimeout(go, 400);
  window.setTimeout(() => {
    go();
    active = false;
    for (const e of events) window.removeEventListener(e, stop);
  }, 1200);
  return true;
}
