import type { InkScene } from "./types";
import { WORDMARK } from "./drawn";
import { CORRIDOR, ENERGY, FEED, GRAMCARBON, HERO, METHANE, OFFSETS } from "./traced";

/**
 * The doodles the ink line draws, in page order. Each chapter's drawing is a
 * freehand continuous line traced from the approved one-line illustrations
 * (traced.ts); the wordmark is the original drawing, smoothed (drawn.ts).
 * InkLine fits each w x h box into its `.doodle-box` and rewrites the points
 * into page coordinates.
 *
 * Conventions, which InkLine and the links rely on:
 * - every box is its drawing: a scene's w x h is the drawing's own extent, and
 *   the page gives its box the same proportions (Scene, .hero-art);
 * - every drawing but the finale enters from its left edge, so the hero's
 *   first stroke runs on from the title's full stop into it and each link
 *   arrives from the side; the finale starts on the z of the logo, so the
 *   line runs into it;
 * - every scene but the last leaves through its bottom edge heading down;
 * - labels sit clear of the line at every size (at least ~7px on a phone).
 */
export const SCENES = {
  // hero: drawn by the pointer or the first quarter-screen of scroll
  cow: HERO,
  // CH4OW: she burps a string of round methane bubbles, "CH4" in the big ones, "LESS"
  methane: {
    ...METHANE,
    labels: [
      { x: 676, y: 354, text: "CH₄", size: 26, at: 0.55, weight: 500 },
      { x: 785, y: 234, text: "CH₄", size: 34, at: 0.65, weight: 500 },
      { x: 771, y: 434, text: "CH₄", size: 34, at: 0.75, weight: 500 },
      { x: 790, y: 545, text: "LESS", size: 24, at: 0.88, weight: 500, deco: "underline" },
    ],
  },
  // feed and TMR: fodder grass, a bowl of TMR, a tractor hauling bales
  feed: FEED,
  // green energy: fodder, cow, manure, biogas plant and CBG, fertiliser, round again
  energy: ENERGY,
  // the corridor: cow, feed, tractor, milk, biogas and data on one road
  corridor: CORRIDOR,
  // gramCarbon: the line writes the wordmark, the logo's three petals for its r
  gramcarbon: GRAMCARBON,
  // carbon value: the ZE SITA coin
  offsets: OFFSETS,
  // partners: the line writes the zeroearth wordmark, then hands over to the logo
  finale: {
    w: 900,
    h: 360,
    // the wordmark image that takes over from the drawn line: x, y, width, height
    logo: [20, 104, 860, 150.9],
    d: WORDMARK,
  },
} satisfies Record<string, InkScene>;

export type SceneName = keyof typeof SCENES;
