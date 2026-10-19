/**
 * Routing for the links between scenes: each link leaves the previous doodle
 * heading down, threads once through a letter of every big headline on its
 * way, keeps clear of everything else (other letters, copy, cards, images,
 * the page edges), and arrives at the next doodle heading down.
 *
 * A crossing is a short, steep stroke (never more than 25 degrees from the
 * vertical) through one of the last two letters of a word: a dark letter by
 * preference, so the gradient copy shows; a gradient one, or the headline's
 * full stop, only when no dark letter can be reached cleanly. A letter whose
 * way in or out would have to squeeze past another line of the headline is
 * not used, and the crossing touches no other letter.
 *
 * Everything is in page coordinates and built from the live layout, so the
 * route holds at every viewport size.
 */

export type Vec = [number, number];

export interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
  /** opaque (a photo): the line may pass behind it when there is no way round */
  soft?: boolean;
}

/** a point the line passes through, with its heading there */
export interface Waypoint {
  p: Vec;
  dir: Vec;
}

/** one letter of a headline the line can pass through */
export interface Letter {
  box: Box;
  /** left and right of the glyph's ink, and its baseline */
  ink: [number, number];
  baseline: number;
  /** middle of the x-height, where the line crosses */
  mid: Vec;
  /** set in the gradient (accent) colour */
  grad: boolean;
  /** headline font size */
  em: number;
  /** index of its word in the headline, so the rest of the word is not an obstacle */
  word: number;
  ch: string;
  /** letters from the end of its word, punctuation aside (0: the last), -1 for punctuation */
  fromEnd: number;
}

export interface Headline {
  letters: Letter[];
  box: Box;
  em: number;
}

const DOWN: Vec = [0, 1];

export const unit = (x: number, y: number): Vec => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

/** the longest arm along a heading with a sideways part, so a long link never swings far out to the side */
const SIDE_ARM = 140;

/** the cubic between two waypoints: arms along their headings, never looping back */
export function cubic(a: Waypoint, b: Waypoint): [Vec, Vec, Vec, Vec] {
  const dx = b.p[0] - a.p[0];
  const dy = b.p[1] - a.p[1];
  const chord = Math.hypot(dx, dy);
  // arms in proportion to the chord; when both ends head down, the arms share
  // the drop between them so the curve keeps falling and never doubles back
  let armA = chord * 0.42;
  let armB = chord * 0.42;
  if (dy > 0) {
    if (a.dir[1] > 0.2) armA = Math.min(armA, (dy * 0.85) / a.dir[1]);
    if (b.dir[1] > 0.2) armB = Math.min(armB, (dy * 0.85) / b.dir[1]);
  }
  if (Math.abs(a.dir[0]) > 0.05) armA = Math.min(armA, SIDE_ARM);
  if (Math.abs(b.dir[0]) > 0.05) armB = Math.min(armB, SIDE_ARM);
  return [
    a.p,
    [a.p[0] + a.dir[0] * armA, a.p[1] + a.dir[1] * armA],
    [b.p[0] - b.dir[0] * armB, b.p[1] - b.dir[1] * armB],
    b.p,
  ];
}

function bezier([p0, p1, p2, p3]: [Vec, Vec, Vec, Vec], t: number): Vec {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

type Bez = [Vec, Vec, Vec, Vec];

/** radius of the rounded corners where a straight link turns */
const CORNER = 36;

/** a straight stroke, as a cubic */
const straight = (a: Vec, b: Vec): Bez => [
  a,
  [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3],
  [a[0] + ((b[0] - a[0]) * 2) / 3, a[1] + ((b[1] - a[1]) * 2) / 3],
  b,
];

/**
 * The straight way between two waypoints: straight down to halfway, straight
 * across, straight down again, with rounded corners; one straight stroke when
 * they are in line, or when b is not below a.
 */
function elbow(a: Waypoint, b: Waypoint): Bez[] {
  const [x0, y0] = a.p;
  const [x1, y1] = b.p;
  const dx = x1 - x0;
  const dy = y1 - y0;
  if (Math.abs(dx) < 1 || dy < 4) return [straight(a.p, b.p)];
  const ym = y0 + dy / 2;
  const s = Math.sign(dx);
  const r = Math.min(CORNER, Math.abs(dx) / 2, dy / 4);
  const k = 0.552 * r;
  const out: Bez[] = [];
  const run = (from: Vec, to: Vec) => {
    if (Math.hypot(to[0] - from[0], to[1] - from[1]) > 0.5) out.push(straight(from, to));
  };
  run([x0, y0], [x0, ym - r]);
  out.push([[x0, ym - r], [x0, ym - r + k], [x0 + s * (r - k), ym], [x0 + s * r, ym]]);
  run([x0 + s * r, ym], [x1 - s * r, ym]);
  out.push([[x1 - s * r, ym], [x1 - s * (r - k), ym], [x1, ym + r - k], [x1, ym + r]]);
  run([x1, ym + r], [x1, y1]);
  return out;
}

/** the curves the line takes between two waypoints: one smooth cubic, or a straight elbow */
const segments = (a: Waypoint, b: Waypoint, straightWay = false): Bez[] => (straightWay ? elbow(a, b) : [cubic(a, b)]);

const inside = ([x, y]: Vec, o: Box) => x > o.l && x < o.r && y > o.t && y < o.b;

/** how close a link may come to either edge of the page */
const EDGE = 8;

/** does the way between two waypoints touch any obstacle, or leave the page? */
export function blocked(a: Waypoint, b: Waypoint, obstacles: Box[], width: number, straightWay = false) {
  const curves = segments(a, b, straightWay);
  // the curves stay inside their control points' box: only obstacles there can touch them
  const xs = curves.flat().map((v) => v[0]);
  const ys = curves.flat().map((v) => v[1]);
  const [l, r, t, btm] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const near = obstacles.filter((o) => o.r > l && o.l < r && o.b > t && o.t < btm);
  const edges = l < EDGE || r > width - EDGE;
  if (!near.length && !edges) return false;
  for (const c of curves) {
    const n = Math.max(8, Math.ceil(Math.hypot(c[3][0] - c[0][0], c[3][1] - c[0][1]) / 5));
    for (let i = 1; i < n; i++) {
      const p = bezier(c, i / n);
      if (p[0] < EDGE || p[0] > width - EDGE) return true;
      for (const o of near) if (inside(p, o)) return true;
    }
  }
  return false;
}

function length(points: Waypoint[]) {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += Math.hypot(points[i].p[0] - points[i - 1].p[0], points[i].p[1] - points[i - 1].p[1]);
  }
  return sum;
}

export interface RouteContext {
  /** copy, images and cards between the two doodles */
  obstacles: Box[];
  /** page width: the lane down the right margin stays inside it */
  width: number;
  /** straight runs with rounded corners instead of sweeping curves */
  straight?: boolean;
}

/** letters too thin across their middle for a crossing to show */
const THIN = /[rijlf1]/;
/** letters whose middle is a stem: a near-vertical crossing would run along it, not across */
const STEM = /[mnhuk]/;
/** steepest the crossing may lean from the vertical: a thread through the letter, not a strike through the word */
const MAX_TILT = Math.tan((25 * Math.PI) / 180);

/** vertical drop into or out of the margin lane, as a share of the sideways move; the first ones read best */
const DROPS = [1, 0.8, 1.3, 0.6, 1.7, 0.45, 0.3];

/** the lane down the right margin sits this far in from the page edge, and never closer than LANE_MIN */
const LANE_IN = 18;
const LANE_MIN = 10;
/** a long run down the lane wanders this far either side, over this long, so it reads as drawn, not ruled */
const WOBBLE = 4;
const WOBBLE_RUN = 300;

/**
 * Waypoints from `a` to `b` that keep clear of the obstacles: straight there
 * if the curve is clear, otherwise down a lane in the right margin, past the
 * copy, and back in. Returns the waypoints strictly between a and b, or null
 * when there is no clear way (with `force`, the best lane anyway).
 */
function connect(a: Waypoint, b: Waypoint, obstacles: Box[], ctx: RouteContext, force = false): Waypoint[] | null {
  // first keep clear of everything; failing that, allow passing behind photos
  const hard = obstacles.filter((o) => !o.soft);
  for (const set of hard.length < obstacles.length ? [obstacles, hard] : [obstacles]) {
    const found = clearWay(a, b, set, ctx);
    if (found) return found;
  }
  if (!force) return null;
  const lane = laneFor(a, b, hard, ctx) ?? ctx.width - LANE_MIN;
  const [l1, l2] = lanePair(a, b, lane, DROPS[0], DROPS[0]);
  return l2.p[1] > l1.p[1] + 1 ? [l1, ...wobble(l1, l2, hard, ctx), l2] : [];
}

/** the x of a lane down the right margin past the obstacles between a and b, or null if there is no room */
function laneFor(a: Waypoint, b: Waypoint, obstacles: Box[], ctx: RouteContext) {
  const top = Math.min(a.p[1], b.p[1]);
  const bottom = Math.max(a.p[1], b.p[1]);
  const span = obstacles.filter((o) => o.b > top && o.t < bottom);
  const right = Math.max(...span.map((o) => o.r), a.p[0], b.p[0]);
  // in from the edge by LANE_IN, or just past the copy if that is further out, never closer than LANE_MIN
  const lane = Math.min(ctx.width - LANE_MIN, Math.max(ctx.width - LANE_IN, right + 1));
  return lane > right ? lane : null;
}

function lanePair(a: Waypoint, b: Waypoint, lane: number, inDrop: number, outDrop: number): [Waypoint, Waypoint] {
  const gap = Math.max(1, Math.abs(b.p[1] - a.p[1]));
  return [
    { p: [lane, a.p[1] + Math.min(gap * 0.4, Math.abs(lane - a.p[0]) * inDrop + 8)], dir: DOWN },
    { p: [lane, b.p[1] - Math.min(gap * 0.4, Math.abs(lane - b.p[0]) * outDrop + 8)], dir: DOWN },
  ];
}

/** waypoints that let a long straight run down the lane wander a little, where there is room */
function wobble(l1: Waypoint, l2: Waypoint, obstacles: Box[], ctx: RouteContext): Waypoint[] {
  // a straight line runs straight
  if (ctx.straight) return [];
  const run = l2.p[1] - l1.p[1];
  const n = Math.floor(run / WOBBLE_RUN);
  if (n < 1) return [];
  const step = run / (n + 1);
  const out: Waypoint[] = [];
  let prev = l1;
  for (let i = 1; i <= n; i++) {
    const x = Math.min(ctx.width - LANE_MIN, l1.p[0] + (i % 2 ? -WOBBLE : WOBBLE));
    const w: Waypoint = { p: [x, l1.p[1] + step * i], dir: DOWN };
    if (blocked(prev, w, obstacles, ctx.width, ctx.straight)) return [];
    out.push(w);
    prev = w;
  }
  return blocked(prev, l2, obstacles, ctx.width, ctx.straight) ? [] : out;
}

function clearWay(a: Waypoint, b: Waypoint, obstacles: Box[], ctx: RouteContext): Waypoint[] | null {
  if (!blocked(a, b, obstacles, ctx.width, ctx.straight)) return [];
  const lane = laneFor(a, b, obstacles, ctx);
  if (lane === null) return null;
  // the way into the lane depends only on the first drop, the way out only on the second
  const ins = DROPS.map((drop) => lanePair(a, b, lane, drop, drop)[0]).filter((l1) => !blocked(a, l1, obstacles, ctx.width, ctx.straight));
  const outs = DROPS.map((drop) => lanePair(a, b, lane, drop, drop)[1]).filter((l2) => !blocked(l2, b, obstacles, ctx.width, ctx.straight));
  for (const l1 of ins) {
    for (const l2 of outs) {
      if (l2.p[1] > l1.p[1] + 1 && !blocked(l1, l2, obstacles, ctx.width, ctx.straight)) return [l1, ...wobble(l1, l2, obstacles, ctx), l2];
    }
  }
  return null;
}

export const turn = (a: Vec, b: Vec) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1])));

/**
 * The route of one link: from the end of one doodle (heading down), through
 * one letter of each headline in between, to the start of the next doodle
 * (along its first heading). Returns every waypoint, ends included.
 */
export function route(
  from: Vec,
  to: Vec,
  headlines: Headline[],
  ctx: RouteContext,
  toDir: Vec = DOWN,
  fromDir: Vec = DOWN,
): Waypoint[] {
  const start: Waypoint = { p: from, dir: unit(fromDir[0], fromDir[1]) };
  // arrive along the drawing's own first heading; a drawing that starts out
  // sideways (the wordmark) is reached from straight above, with a short J
  // into its first stroke, never by swinging past it and hooking back
  const heading = unit(toDir[0], toDir[1]);
  const end: Waypoint = { p: to, dir: heading[1] >= 0.35 ? heading : unit(heading[0], 0.35) };
  const curl: Waypoint[] = [];
  if (heading[1] < 0.35) {
    const r = Math.min(70, Math.max(30, (headlines[0]?.em ?? 100) * 0.4));
    end.dir = heading;
    curl.push({ p: [Math.max(EDGE + 6, to[0] - heading[0] * r * 0.2), to[1] - r], dir: DOWN });
  }
  const arrive = curl[0] ?? end;
  const points: Waypoint[] = [start];
  // only what lies between the two doodles can be in the way
  const top = Math.min(from[1], to[1]) - 40;
  const bottom = Math.max(from[1], to[1]) + 40;
  const local: RouteContext = { ...ctx, obstacles: ctx.obstacles.filter((o) => o.b > top && o.t < bottom) };
  const letters = headlines.flatMap((h) => h.letters);
  // every letter is an obstacle (its ink, padded), except those being crossed (and those just left)
  const inkBox = (l: Letter, padX: number, padY: number): Box => ({
    l: l.ink[0] - l.em * padX,
    r: l.ink[1] + l.em * padX,
    t: l.box.t - l.em * padY,
    b: l.box.b + l.em * padY,
  });
  const padded = new Map(letters.map((l) => [l.box, inkBox(l, 0.07, 0.05)]));
  const without = (skip: Set<Box>) => [
    ...local.obstacles,
    ...letters.filter((l) => !skip.has(l.box)).map((l) => padded.get(l.box)!),
  ];
  /** does carrying straight on from p along dir (or back against it) run into another line of the headline? */
  const walled = (h: Headline, letter: Letter, p: Vec, dir: Vec, sign: 1 | -1) => {
    const others = h.letters.filter((l) => sign * (l.baseline - letter.baseline) > 1).map((l) => inkBox(l, 0.03, 0.03));
    if (!others.length) return false;
    const reach = Math.max(...others.map((o) => (sign > 0 ? o.b - p[1] : p[1] - o.t)));
    for (let s = 0; s <= reach; s += 4) {
      const q: Vec = [p[0] + dir[0] * s * sign, p[1] + dir[1] * s * sign];
      if (others.some((o) => inside(q, o))) return true;
    }
    return false;
  };
  let current = start;
  let behind = new Set<Box>();

  headlines.forEach((headline, i) => {
    // where the line goes after this headline: the next one, or the doodle
    const next = headlines[i + 1];
    const after: Waypoint = next ? { p: [(next.box.l + next.box.r) / 2, next.box.t], dir: DOWN } : arrive;
    let best = null as { cost: number; legs: Waypoint[]; word: Set<Box> } | null;

    // the full stop that ends the headline: a fallback where no letter can be crossed cleanly
    const stop = headline.letters[headline.letters.length - 1];
    headline.letters.forEach((letter, index) => {
      // one of the last two letters of a word, and one with ink across its middle
      const isStop = letter === stop && letter.ch === ".";
      if (!isStop && (letter.fromEnd < 0 || letter.fromEnd > 1 || THIN.test(letter.ch))) return;
      // the crossed letter and its neighbours in the word may be touched; every other letter is an obstacle
      const neighbours = headline.letters.filter((l, j) => l.word === letter.word && Math.abs(j - index) <= 1);
      const word = new Set(neighbours.map((l) => l.box));
      // the heading that bisects the way in and the way on, leaning toward where the line goes next
      const onDir = unit(after.p[0] - letter.mid[0], Math.max(1, after.p[1] - letter.mid[1]));
      const inDir = unit(letter.mid[0] - current.p[0], Math.max(1, letter.mid[1] - current.p[1]));
      const slope = (inDir[0] + onDir[0]) / (inDir[1] + onDir[1]);
      const side = Math.sign(onDir[0]) || Math.sign(slope) || 1;
      const tilts = [Math.max(-MAX_TILT, Math.min(MAX_TILT, slope)), side * MAX_TILT, side * 0.25, 0, -side * 0.25, -side * MAX_TILT];
      // through the middle of the letter (or of the dot), or, leaning, a little to the side it leans
      const centre: Vec = isStop ? [(letter.ink[0] + letter.ink[1]) / 2, (letter.box.t + letter.box.b) / 2] : letter.mid;
      const ways = [...new Set(tilts.map((t) => Math.round(t * 1000) / 1000))].flatMap((tilt) =>
        tilt && !isStop ? [[tilt, 0], [tilt, Math.sign(tilt) * 0.2]] : [[tilt, 0]],
      );
      for (const [tilt, shift] of ways) {
        // straight through the letter, from just above its x-height to just under its baseline
        const dir = unit(tilt, 1);
        const reach = letter.em * 0.4;
        const mid: Vec = [centre[0] + shift * (letter.ink[1] - letter.ink[0]), centre[1]];
        const along = (s: number): Waypoint => ({ p: [mid[0] + dir[0] * s, mid[1] + dir[1] * s], dir });
        const [enter, through] = [along(-reach), along(reach)];
        // the crossing goes through this one letter only (punctuation aside)
        if (crossesOthers(enter.p, through.p, letter, neighbours)) continue;
        // ...and it neither leaves into, nor comes out of, another line of the headline
        if (walled(headline, letter, through.p, dir, 1) || walled(headline, letter, enter.p, dir, -1)) continue;
        const into = connect(current, enter, without(new Set([...behind, ...word])), local);
        if (!into) continue;
        // the way on is planned for real from the next headline (or the doodle);
        // here it only weighs the choice, so a blocked guess costs rather than rules out
        const onward = connect(through, after, without(word), local);
        if (!onward && !next) continue;
        const legs = [...into, enter, along(0), through];
        // a crossing should flow: no hairpin into the letter or out of it
        const before = into.length ? into[into.length - 1].p : current.p;
        const beyond = onward?.length ? onward[0].p : after.p;
        const bends =
          turn(unit(enter.p[0] - before[0], enter.p[1] - before[1]), dir) +
          turn(dir, unit(beyond[0] - through.p[0], beyond[1] - through.p[1]));
        const cost =
          bends * letter.em * 1.2 +
          length([current, ...legs, ...(onward ?? []), after]) +
          // the gradient copy reads over the dark letters; a gradient word only when there is no dark one
          (letter.grad ? letter.em * 4 : 0) +
          (isStop ? letter.em * 6 : 0) +
          letter.fromEnd * letter.em * 0.3 +
          // a stem letter crossed near the vertical shows only a hairline
          (STEM.test(letter.ch) && Math.abs(tilt) < 0.18 ? letter.em * (letter.ch === "m" ? 3 : 1) : 0) +
          // a lane is a detour; a crossing with no clear way on is a last resort
          (into.length + (onward?.length ?? 80)) * letter.em * 0.5 +
          Math.abs(tilt) * letter.em * 0.6;
        if (!best || cost < best.cost) best = { cost, legs, word };
      }
    });
    if (best) {
      points.push(...best.legs);
      current = best.legs[best.legs.length - 1];
      behind = best.word;
    }
  });

  points.push(...(connect(current, arrive, without(behind), local, true) ?? []), ...curl, end);
  return points;
}

/** does the straight crossing from a to b pass through any letter but `letter` (punctuation aside)? */
function crossesOthers(a: Vec, b: Vec, letter: Letter, neighbours: Letter[]) {
  for (const other of neighbours) {
    if (other === letter || other.fromEnd < 0) continue;
    // the ink sits inside the advance box: shrink it a little either side
    const inset = (other.box.r - other.box.l) * 0.18;
    const box = { l: other.box.l + inset, r: other.box.r - inset, t: other.box.t, b: other.box.b };
    for (let k = 0; k <= 8; k++) {
      const p: Vec = [a[0] + ((b[0] - a[0]) * k) / 8, a[1] + ((b[1] - a[1]) * k) / 8];
      if (inside(p, box)) return true;
    }
  }
  return false;
}

/** absolute M + C path data through the waypoints (straight elbows between them with `straightWay`) */
export function pathData(points: Waypoint[], straightWay = false) {
  const f = (v: Vec) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
  let d = `M${f(points[0].p)}`;
  for (let i = 1; i < points.length; i++) {
    for (const [, c1, c2, p] of segments(points[i - 1], points[i], straightWay)) d += ` C${f(c1)} ${f(c2)} ${f(p)}`;
  }
  return d;
}

/** points along absolute M + C path data, about every `step` px */
export function samplePath(d: string, step = 6): Vec[] {
  const nums = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const out: Vec[] = [];
  let p0: Vec = [nums[0], nums[1]];
  out.push(p0);
  for (let i = 2; i + 5 < nums.length + 0.5; i += 6) {
    const c: [Vec, Vec, Vec, Vec] = [p0, [nums[i], nums[i + 1]], [nums[i + 2], nums[i + 3]], [nums[i + 4], nums[i + 5]]];
    const n = Math.max(2, Math.ceil(Math.hypot(c[3][0] - p0[0], c[3][1] - p0[1]) / step));
    for (let k = 1; k <= n; k++) out.push(bezier(c, k / n));
    p0 = c[3];
  }
  return out;
}

/**
 * Does the line along the waypoints keep at least `gap` px from the drawing
 * (sampled points), apart from within `near` px of where it joins it?
 */
export function keepsClear(points: Waypoint[], drawing: Vec[], gap: number, near: number) {
  const join = points[points.length - 1].p;
  const path = samplePath(pathData(points), 4);
  return path.every(
    (q) =>
      Math.hypot(q[0] - join[0], q[1] - join[1]) < near ||
      drawing.every((r) => Math.abs(r[0] - q[0]) > gap || Math.abs(r[1] - q[1]) > gap || Math.hypot(r[0] - q[0], r[1] - q[1]) > gap),
  );
}
