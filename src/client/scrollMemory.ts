/**
 * Every load starts at the top, a reload included. main.tsx turns the
 * browser's own scroll restoration off, so nothing puts a reloaded page back
 * further down; these exports stay so the callers keep one place to ask.
 */

/** a reload is never put back further down, so the loader is not skipped for one */
export const restoringScroll = false;

/** nothing to restore: the caller opens the page at the top */
export function restoreScroll(): boolean {
  return false;
}
