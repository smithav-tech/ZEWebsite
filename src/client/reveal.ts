/**
 * The loader fires "ze:reveal" the moment its ripple starts opening onto the
 * live page. Anything that would otherwise play unseen behind the
 * curtain (the opening milk wave, the hero cow following the pointer) waits
 * for it, with a failsafe so nothing ever stays parked if the event is missed.
 */

export const REVEAL_EVENT = "ze:reveal";
const FAILSAFE_MS = 6500;

// a DOM flag rather than a module variable: it survives a hot reload of this file
const root = document.documentElement;
window.addEventListener(REVEAL_EVENT, () => root.setAttribute("data-revealed", ""), { once: true });

/** Runs `fn` once the page is revealed (or after the failsafe). Returns a cancel function. */
export function whenRevealed(fn: () => void): () => void {
  if (root.hasAttribute("data-revealed")) {
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
  const timer = window.setTimeout(fire, FAILSAFE_MS);
  window.addEventListener(REVEAL_EVENT, fire);
  function cancel() {
    settled = true;
    clearTimeout(timer);
    window.removeEventListener(REVEAL_EVENT, fire);
  }
  return cancel;
}
