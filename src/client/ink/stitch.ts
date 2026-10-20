import { blocked, keepsClear, pathData, route, samplePath, turn, unit, type Box, type Headline, type Vec, type Waypoint } from "./route";

/**
 * The hero's first stroke. The line begins as the tail of the last letter of
 * the title (the "y" of "dairy."), runs on at a shallow angle through the
 * full stop, and swings down into the first doodle where it starts. It is
 * planned from the live layout at every size: straight there when the way is
 * clear, otherwise through one of a few swoops across the open space, always
 * clear of the copy and the page edges and never across the drawing itself.
 */
export function heroStitch(
  title: Headline,
  to: Vec,
  toDir: Vec,
  obstacles: Box[],
  width: number,
  drawing: Vec[],
  stroke: number,
): Waypoint[] | null {
  const lastWord = Math.max(...title.letters.map((l) => l.word));
  const word = title.letters.filter((l) => l.word === lastWord);
  const last = word.filter((l) => l.fromEnd >= 0).pop();
  if (!last) return null;
  const stop = word[word.indexOf(last) + 1];
  const em = last.em;
  // the tail of the letter: the right of its ink, just above the baseline
  const tail: Waypoint = { p: [last.ink[1] - em * 0.035, last.baseline - em * 0.075], dir: unit(1, 0.06) };
  const legs: Waypoint[] = [tail];
  if (stop) {
    const dot: Vec = [(stop.ink[0] + stop.ink[1]) / 2, (stop.box.t + stop.box.b) / 2];
    legs.push({ p: dot, dir: unit(dot[0] - tail.p[0] + em * 0.6, dot[1] - tail.p[1] + em * 0.12) });
  }
  const from = legs[legs.length - 1];
  const heading = unit(toDir[0], toDir[1]);
  const end: Waypoint = { p: to, dir: unit(heading[0], Math.max(0.35, heading[1])) };

  // every letter of the title but the two the stroke runs through is in the way
  const pad = em * 0.05;
  const letters = title.letters
    .filter((l) => l !== last && l !== stop)
    .map((l) => ({ l: l.box.l - pad, r: l.box.r + pad, t: l.box.t - pad, b: l.box.b + pad }));
  const all = [...obstacles, ...letters];

  // the ways to try: straight there, or through a waypoint in the open space between
  const ways: Waypoint[][] = [[]];
  const [x0, y0] = from.p;
  const [x1, y1] = to;
  for (const fy of [0.45, 0.6, 0.3, 0.75]) {
    for (const fx of [0.5, 0.25, 0.75, 0, 1, -0.25]) {
      const p: Vec = [x1 + (x0 - x1) * fx - (x0 > x1 ? 0 : em * 0.3), y0 + (y1 - y0) * fy];
      const inDir = unit(p[0] - x0, p[1] - y0);
      const outDir = unit(x1 - p[0], y1 - p[1]);
      ways.push([{ p, dir: unit(inDir[0] + outDir[0], Math.max(0.2, inDir[1] + outDir[1])) }]);
    }
  }
  let best: { cost: number; points: Waypoint[] } | null = null;
  for (const via of ways) {
    const points = [...legs, ...via, end];
    let clear = true;
    for (let i = legs.length - 1; i < points.length - 1 && clear; i++) {
      if (blocked(points[i], points[i + 1], all, width)) clear = false;
    }
    if (!clear) continue;
    const cost = length(points) + sharpest(points) * em * 2 + (keepsClear(points, drawing, stroke * 2.5, stroke * 18) ? 0 : 1e5);
    if (!best || cost < best.cost) best = { cost, points };
  }
  if (best) return best.points;
  // no swoop is clear (stacked, the copy runs under the title nearly the full
  // width): out to the lane down the right margin, across above the drawing,
  // down just clear of its left-most stroke and into its first stroke, as the
  // links between the chapters do
  const clear = Math.max(12, stroke * 4);
  const left = Math.min(to[0], ...drawing.map((q) => q[0])) - clear;
  const above: Vec = [left, Math.min(...drawing.map((q) => q[1])) - clear];
  if (above[1] <= from.p[1]) return [...legs, end];
  const way = route(from.p, above, [], { obstacles: all, width }, [0, 1], from.dir).slice(1, -1);
  const turnIn = Math.min(clear * 2, to[0] - left, to[1] - above[1]);
  return [...legs, ...way, { p: above, dir: [0, 1] }, { p: [left, to[1] - turnIn], dir: [0, 1] }, end];
}

function length(points: Waypoint[]) {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += Math.hypot(points[i].p[0] - points[i - 1].p[0], points[i].p[1] - points[i - 1].p[1]);
  return sum;
}

/** the sharpest turn along the curves, in radians, over a few pixels' window */
function sharpest(points: Waypoint[]) {
  const pts = samplePath(pathData(points), 4);
  let worst = 0;
  for (let k = 6; k < pts.length - 6; k++) {
    const a = unit(pts[k][0] - pts[k - 6][0], pts[k][1] - pts[k - 6][1]);
    const b = unit(pts[k + 6][0] - pts[k][0], pts[k + 6][1] - pts[k][1]);
    worst = Math.max(worst, turn(a, b));
  }
  return worst;
}

