/**
 * A pen that writes ONE continuous stroke as absolute `M` + `C` path data,
 * the only commands InkLine rewrites. Every move continues from where the
 * last one ended, so a scene is drawn the way a hand would draw it.
 *
 * - `through(...points)`: a smooth curve through the points. It leaves the
 *   current point along the current heading (unless the pen just turned a
 *   corner), and each point gets the tangent that bisects its neighbours, so
 *   the curve never kinks or overshoots. A point written `[x, y, 1]` is a
 *   corner: the curve arrives and leaves along the straight chords.
 * - `line(x, y)`: a straight stroke (written as a cubic).
 * - `arc(cx, cy, degrees)`: a circular arc about a centre, from the current
 *   point; positive degrees turn clockwise on screen.
 * - `corner()`: the next move starts without carrying the heading over.
 * - `retrace(from, to?)`: runs back exactly over segments `from` up to `to`
 *   (counts; `to` defaults to everything since `from`), so a pen can return
 *   along a stroke without a second line; `again(from, to)` runs forward
 *   over them once more. Either starts where the pen is, which must be the
 *   matching end of those segments.
 */
export type Pt = [x: number, y: number, corner?: 1];

const f = (n: number) => (Math.abs(n) < 0.05 ? "0.0" : n.toFixed(1));

function unit(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

export class Pen {
  private parts: string[];
  /** every cubic so far, for retrace(): x0, y0, c1x, c1y, c2x, c2y, x, y */
  private segs: number[][] = [];
  private x: number;
  private y: number;
  /** unit heading at the current point; null right after a corner */
  private heading: [number, number] | null;

  constructor(x: number, y: number, heading: [number, number] | null = null) {
    this.parts = [`M${f(x)},${f(y)}`];
    this.x = x;
    this.y = y;
    this.heading = heading ? unit(...heading) : null;
  }

  private cubic(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    this.parts.push(`C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(x)},${f(y)}`);
    this.segs.push([this.x, this.y, c1x, c1y, c2x, c2y, x, y]);
    this.x = x;
    this.y = y;
  }

  /** straight to (x, y) */
  line(x: number, y: number) {
    const dx = x - this.x;
    const dy = y - this.y;
    this.cubic(this.x + dx / 3, this.y + dy / 3, this.x + (2 * dx) / 3, this.y + (2 * dy) / 3, x, y);
    this.heading = unit(dx, dy);
    return this;
  }

  /** a smooth curve through the points; `end` fixes the heading at the last one */
  through(points: Pt[], end?: [number, number]) {
    const pts: Pt[] = [[this.x, this.y, this.heading ? undefined : 1], ...points];
    const n = pts.length;
    const tangents: [number, number][] = [];
    const chord = (i: number) => unit(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        tangents.push(this.heading ?? chord(0));
      } else if (i === n - 1) {
        if (end) tangents.push(unit(...end));
        else if (pts[i][2]) tangents.push(chord(i - 1));
        else {
          // a natural end: mirror the previous tangent about the last chord
          const [cx, cy] = chord(i - 1);
          const [px, py] = tangents[i - 1];
          tangents.push(unit(2 * cx - px, 2 * cy - py));
        }
      } else if (pts[i][2]) {
        tangents.push(chord(i - 1)); // arriving tangent; leaving one is set per segment
      } else {
        const [ax, ay] = chord(i - 1);
        const [bx, by] = chord(i);
        tangents.push(unit(ax + bx, ay + by));
      }
    }
    for (let i = 0; i < n - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0) / 3;
      const out = pts[i][2] && i > 0 ? chord(i) : tangents[i];
      const inn = tangents[i + 1];
      this.cubic(x0 + out[0] * len, y0 + out[1] * len, x1 - inn[0] * len, y1 - inn[1] * len, x1, y1);
    }
    this.heading = pts[n - 1][2] && !end ? null : tangents[n - 1];
    return this;
  }

  /** a circular arc about (cx, cy) from the current point, `deg` degrees (clockwise on screen when positive) */
  arc(cx: number, cy: number, deg: number) {
    const r = Math.hypot(this.x - cx, this.y - cy);
    let a = Math.atan2(this.y - cy, this.x - cx);
    const steps = Math.max(1, Math.ceil(Math.abs(deg) / 90));
    const da = ((deg / steps) * Math.PI) / 180;
    const k = (4 / 3) * Math.tan(da / 4) * r;
    for (let i = 0; i < steps; i++) {
      const b = a + da;
      this.cubic(
        cx + r * Math.cos(a) - k * Math.sin(a),
        cy + r * Math.sin(a) + k * Math.cos(a),
        cx + r * Math.cos(b) + k * Math.sin(b),
        cy + r * Math.sin(b) - k * Math.cos(b),
        cx + r * Math.cos(b),
        cy + r * Math.sin(b),
      );
      a = b;
    }
    const s = Math.sign(deg);
    this.heading = [-Math.sin(a) * s, Math.cos(a) * s];
    return this;
  }

  /**
   * Straight strokes through the points with every corner rounded to radius
   * `r` (the last point is reached square on), the way a pen turns a corner.
   */
  rounded(points: [number, number][], r: number) {
    const pts: [number, number][] = [[this.x, this.y], ...points];
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      if (i === pts.length - 1) {
        this.line(x, y);
        break;
      }
      const [ax, ay] = unit(x - pts[i - 1][0], y - pts[i - 1][1]);
      const [bx, by] = unit(pts[i + 1][0] - x, pts[i + 1][1] - y);
      const inLen = Math.hypot(x - this.x, y - this.y);
      const outLen = Math.hypot(pts[i + 1][0] - x, pts[i + 1][1] - y);
      const k = Math.min(r, inLen / 2, outLen / 2);
      const sx = x - ax * k;
      const sy = y - ay * k;
      const ex = x + bx * k;
      const ey = y + by * k;
      if (Math.hypot(sx - this.x, sy - this.y) > 0.5) this.line(sx, sy);
      // a quarter-circle-like turn: control points 55% of the way to the corner
      this.cubic(sx + ax * k * 0.55, sy + ay * k * 0.55, ex - bx * k * 0.55, ey - by * k * 0.55, ex, ey);
      this.heading = [bx, by];
    }
    return this;
  }

  /** back along segments `from` up to `to` (counts), exactly over the same line */
  retrace(from: number, to = this.segs.length) {
    const back = this.segs.slice(from, to).reverse();
    for (const [x0, y0, c1x, c1y, c2x, c2y] of back) this.cubic(c2x, c2y, c1x, c1y, x0, y0);
    const first = back[back.length - 1];
    if (first) this.heading = unit(first[0] - first[2], first[1] - first[3]);
    return this;
  }

  /** forward again over segments `from` up to `to` (counts), from where the first of them began */
  again(from: number, to: number) {
    for (const [, , c1x, c1y, c2x, c2y, x, y] of this.segs.slice(from, to)) this.cubic(c1x, c1y, c2x, c2y, x, y);
    const last = this.segs[to - 1];
    if (last) this.heading = unit(last[6] - last[4], last[7] - last[5]);
    return this;
  }

  /** the next move leaves the current point along its own chord */
  corner() {
    this.heading = null;
    return this;
  }

  /** cubic segments written so far (a scene marks where its lead-in ends with this) */
  get count() {
    return this.parts.length - 1;
  }

  get d() {
    return this.parts.join(" ");
  }
}
