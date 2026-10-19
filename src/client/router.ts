import { useSyncExternalStore, type MouseEvent } from "react";

/** A tiny history-API router: two pages, no library. */

const CHANGE = "ze:navigate";

const normalise = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p) || "/";
const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(CHANGE, cb);
  };
};

/** The current pathname, without a trailing slash. */
export const usePath = () => useSyncExternalStore(subscribe, () => normalise(location.pathname));

/** Scroll to `id` once it is rendered (the page may have just mounted), else to the top. */
function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.slice(1));
  if (!id) return window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  let tries = 0;
  const tick = () => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else if (++tries < 60) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Client-side navigation to `path`, optionally with a `#hash`. */
export function navigate(to: string) {
  const url = new URL(to, location.href);
  if (url.pathname !== location.pathname) {
    history.pushState(null, "", url.pathname + url.search + url.hash);
    window.dispatchEvent(new Event(CHANGE));
  } else if (url.hash !== location.hash) {
    history.pushState(null, "", url.pathname + url.search + url.hash);
  }
  scrollToHash(url.hash);
}

/**
 * Link props for a destination on a page. A plain left click navigates
 * client-side; modified clicks, middle-click and new tabs use the real href.
 */
export function pageLink(to: string, onNavigate?: () => void) {
  return {
    href: to,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      onNavigate?.();
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navigate(to);
    },
  };
}

/**
 * Link props for a home-page section: a plain in-page hash on the home page,
 * a client-side trip home plus scroll from anywhere else.
 */
export function sectionLink(hash: string, path: string, onNavigate?: () => void) {
  return path === "/" ? { href: hash, onClick: () => onNavigate?.() } : pageLink("/" + hash, onNavigate);
}
