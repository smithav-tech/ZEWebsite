/**
 * The loader fires "ze:reveal" the moment its ripple starts opening onto the
 * live page. Anything that would otherwise play unseen behind the
 * curtain (the opening milk wave, the hero cow following the pointer) waits
 * for it, with a failsafe so nothing ever stays parked if the event is missed.
 *
 * InkLine fires "ze:ink-ready" once it has laid the line out with the
 * webfonts in. That layout is the heaviest piece of work on the page, so the
 * loader holds its first frame for it rather than stalling part way through.
 */

export const REVEAL_EVENT = "ze:reveal";
export const INK_READY_EVENT = "ze:ink-ready";
const FAILSAFE_MS = 6500;
/** the loader never waits longer than this for the line */
const INK_FAILSAFE_MS = 1500;

// DOM flags rather than module variables: they survive a hot reload of this file
const root = document.documentElement;
window.addEventListener(REVEAL_EVENT, () => root.setAttribute("data-revealed", ""), { once: true });

/** Runs `fn` once `event` has fired (its flag is set) or after `ms`. Returns a cancel function. */
function whenFlagged(flag: string, event: string, ms: number, fn: () => void): () => void {
  if (root.hasAttribute(flag)) {
    fn();
    return () => {};
  }
  let settled = false;
  const fire = () => {
    if (settled) return;
    settled = true;
    cancel();
    fn();
  };
  const timer = window.setTimeout(fire, ms);
  window.addEventListener(event, fire);
  function cancel() {
    settled = true;
    clearTimeout(timer);
    window.removeEventListener(event, fire);
  }
  return cancel;
}

/** Runs `fn` once the page is revealed (or after the failsafe). Returns a cancel function. */
export function whenRevealed(fn: () => void): () => void {
  return whenFlagged("data-revealed", REVEAL_EVENT, FAILSAFE_MS, fn);
}

/** has the loader opened onto the page (or was there no loader)? */
export const isRevealed = () => root.hasAttribute("data-revealed");

/** InkLine: the line is laid out with the webfonts in */
export function markInkReady() {
  if (root.hasAttribute("data-ink-ready")) return;
  root.setAttribute("data-ink-ready", "");
  window.dispatchEvent(new Event(INK_READY_EVENT));
}

/** Runs `fn` once the line is laid out (or after a short failsafe). Returns a cancel function. */
export function whenInkReady(fn: () => void): () => void {
  return whenFlagged("data-ink-ready", INK_READY_EVENT, INK_FAILSAFE_MS, fn);
}
