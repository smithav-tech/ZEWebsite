import { useEffect, useRef } from "react";
import gsap from "gsap";
import { brand } from "../content";
import { isRevealed, markInkReady, whenRevealed } from "../reveal";
import { parsePath, pathData, route, sampleCurve, segmentLengths, type Box, type Headline, type Letter } from "./route";
import { SCENES, type SceneName } from "./scenes";
import { heroStitch } from "./stitch";
import type { InkScene } from "./types";

/**
 * ONE LINE. A single black stroke runs the length of the page: it draws the
 * hero cow, then links down into each section's doodle and on to the
 * zeroearth wordmark above the partners, where the drawn letters hand over to
 * the real logo.
 *
 * How it works
 * - Layout: every `.doodle-box` is measured, its scene path is scaled into the
 *   box (contain, centred) and rewritten in page coordinates. Consecutive
 *   scenes are joined by a "link" (route.ts) that keeps clear of the copy and
 *   of every headline, line by line (only the hero title's stitch runs into
 *   a letter). Each
 *   piece becomes a path in two page-sized SVGs: a black one behind the
 *   content (`.ink--back`) and one in front of it (`.ink--front`), clipped to
 *   the headline glyphs. Where the line crosses a dark letter it turns into
 *   the brand gradient; over a gradient letter it stays black.
 * - Progress: one number, the length of line drawn, laid end to end across the
 *   pieces. Each drawing plays straight through on its own as soon as its
 *   section starts to come into view (and starts over when you scroll back
 *   above it); once it is done, the link runs on to the next drawing and
 *   waits there. A drawing scrolled right past counts as done. The hero cow
 *   draws itself once the page opens (pointer travel or the first
 *   quarter-screen of scroll can finish it sooner).
 * - Drawing: the shown length eases toward that target each frame. Each piece
 *   is cut into short chunks: the chunks behind the pen are plain strokes, the
 *   ones ahead are hidden, and only the one under the pen reveals its share
 *   through stroke-dashoffset, so a frame repaints a few pixels of line, not
 *   a whole drawing (dashing a long path is slow on an old laptop). Only the
 *   chunks near a headline get the front copies. Labels fade in at their
 *   fraction of the stroke; the last scene can glow; the finale swaps the
 *   drawn wordmark for the logo image.
 * Reduced motion: everything is drawn at once and the pointer is ignored.
 */

/** a drawing scrolled above this fraction of the viewport height counts as done */
const HEAD = 0.72;
/** pointer travel (px) that draws the whole hero cow */
const POINTER_TRAVEL = 2200;
/** scrolling this fraction of a screen also completes the cow */
const HERO_SCROLL = 0.25;
/** the hero cow draws itself over this long (s) once the page opens */
const SELF_DRAW = 2.2;
/** ...starting this long (s) after the loader starts to open */
const OPEN_DELAY = 0.8;
/** every other drawing plays through over this long (s) once the line reaches it */
const PLAY = 2.4;
/** a drawing starts as soon as its section's top comes up past this fraction of the screen */
const ENTER = 0.9;
/**
 * One stroke weight for the whole line, in every scene and link: a little
 * heavier than the stem of the body text (DM Sans stems are 0.085em), so it
 * scales with the type and is lighter on a phone.
 */
const STROKE_EM = 0.11;
const STROKE_MIN = 1.75;
const STROKE_MAX = 3;
/** the big headlines the line threads through, and whose glyphs it shows over */
const HEADLINES = ".hero-title, .display";
/** what the links keep clear of: copy, buttons, cards, photos */
const OBSTACLES =
  "main p, main li, main h3, main h4, main dt, main dd, main blockquote, main figcaption, main button, main .btn";
/** ...and the opaque things it may pass behind if it must */
const MEDIA = "main img, main video, main picture, main figure, main .portrait";
const GRADIENT_STOPS: [string, string][] = [
  ["0", "#a6cf72"],
  ["0.45", "#73c69d"],
  ["0.75", "#4cbfbe"],
  ["1", "#3dbbc9"],
];

/** the length of line (px) in each chunk */
const CHUNK = 160;

const SVG_NS = "http://www.w3.org/2000/svg";

/** a run of line: the M point then six numbers per C segment (as parsePath), and each segment's length */
interface Run {
  nums: number[];
  lengths: number[];
}

/** each scene parsed once, in its own units: whole, and without its lead-in */
const runs = new WeakMap<InkScene, Map<number, Run>>();
function sceneRun(scene: InkScene, lead: number): Run {
  let byLead = runs.get(scene);
  if (!byLead) runs.set(scene, (byLead = new Map()));
  let run = byLead.get(lead);
  if (!run) {
    const whole = lead ? sceneRun(scene, 0) : null;
    if (!whole) {
      const nums = parsePath(scene.d);
      run = { nums, lengths: segmentLengths(nums) };
    } else if (lead >= whole.lengths.length) run = whole;
    // without its first `lead` segments, starting where they end
    else run = { nums: whole.nums.slice(lead * 6), lengths: whole.lengths.slice(lead) };
    byLead.set(lead, run);
  }
  return run;
}

/** to a tenth of a pixel, as the path data is written */
const tenth = (v: number) => Math.round(v * 10) / 10;

type Point = [number, number];

/** a scene fitted into its box on the page */
interface Placed {
  box: HTMLElement;
  scene: InkScene;
  scale: number;
  /** scene units to page coordinates */
  map: (x: number, y: number) => Point;
  /** the drawing in page coordinates */
  run: Run;
  start: Point;
  /** the drawing's heading where it starts, so the link arrives along it */
  startDir: Point;
  end: Point;
  /** beside its copy (desktop), not stacked under it */
  beside: boolean;
  /** document y where it starts to count as in view: its section's top beside the copy, its own top stacked */
  enterY: number;
  /** document y of the top and bottom of its box */
  topY: number;
  bottomY: number;
  interactive: boolean;
  glow: boolean;
}

const HIDDEN = 0;
const PART = 1;
const FULL = 2;

/** a short stretch of a piece, drawn on its own */
interface Chunk {
  /** the black line, then the copies in front of the headlines (none away from them) */
  paths: SVGPathElement[];
  /** where it starts along its piece */
  at: number;
  length: number;
  state: typeof HIDDEN | typeof PART | typeof FULL;
  /** length revealed while PART */
  drawn: number;
}

interface Stroke {
  /** the piece's chunks, grouped: the back group, then the front ones if any chunk needs them */
  groups: SVGGElement[];
  chunks: Chunk[];
  glow: SVGPathElement | null;
  glowOn: boolean;
  length: number;
  /** where this piece starts along the whole line */
  offset: number;
  /** length currently revealed (-1: never set) */
  drawn: number;
}

type Piece = Stroke & ({ kind: "link" } | { kind: "scene"; placed: Placed });

interface Reveal {
  el: SVGElement;
  /** line length at which it shows */
  at: number;
  on: boolean;
}

interface Finale extends Reveal {
  /** the strokes that fade out as the logo arrives: the drawn wordmark (the link stays, ending in the logo) */
  handover: SVGGElement[];
}

/** a headline word, re-set as SVG text for the glyph clips */
interface ClipWord {
  text: string;
  x: number;
  baseline: number;
  width: number;
  size: number;
  family: string;
  weight: string;
  grad: boolean;
}

/** a big headline: its letters (for routing) and words (for the clips), in page coordinates */
function readHeadline(el: HTMLElement, pageBox: DOMRect, measure: CanvasRenderingContext2D, glyphs: Map<string, TextMetrics>) {
  const letters: Letter[] = [];
  const words: ClipWord[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let word = -1;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const style = getComputedStyle(node.parentElement!);
    const size = parseFloat(style.fontSize);
    measure.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
    const lower = style.textTransform === "lowercase";
    const grad = !!node.parentElement!.closest(".grad");
    const font = measure.measureText("x");
    const ascent = font.fontBoundingBoxAscent ?? size * 0.8;
    const descent = font.fontBoundingBoxDescent ?? size * 0.2;
    const xHeight = font.actualBoundingBoxAscent || size * 0.5;
    const content = node.textContent ?? "";
    for (const match of content.matchAll(/\S+/g)) {
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const rect = range.getClientRects()[0];
      if (!rect) continue;
      word++;
      const text = lower ? match[0].toLowerCase() : match[0];
      const baseline = rect.top + (rect.height - (ascent + descent)) / 2 + ascent - pageBox.top;
      words.push({
        text,
        x: rect.left - pageBox.left,
        baseline,
        width: rect.width,
        size,
        family: style.fontFamily,
        weight: style.fontWeight,
        grad,
      });
      const first = letters.length;
      for (let i = 0; i < text.length; i++) {
        range.setStart(node, match.index + i);
        range.setEnd(node, match.index + i + 1);
        const r = range.getClientRects()[0];
        if (!r) continue;
        // a headline repeats its letters: measure each once per font
        const key = `${measure.font}|${text[i]}`;
        let glyph = glyphs.get(key);
        if (!glyph) glyphs.set(key, (glyph = measure.measureText(text[i])));
        const l = r.left - pageBox.left;
        letters.push({
          ch: text[i],
          ink: [l - glyph.actualBoundingBoxLeft, l + glyph.actualBoundingBoxRight],
          baseline,
          box: {
            l,
            r: l + r.width,
            t: baseline - glyph.actualBoundingBoxAscent,
            b: baseline + glyph.actualBoundingBoxDescent,
          },
          // the middle of the ink (not of the advance), half way up the x-height
          mid: [l + (glyph.actualBoundingBoxRight - glyph.actualBoundingBoxLeft) / 2, baseline - xHeight / 2],
          grad,
          em: size,
          word,
          fromEnd: -1,
        });
      }
      // count back from the end of the word, skipping punctuation: the line crosses near the end
      let n = 0;
      for (let i = letters.length - 1; i >= first; i--) {
        if (/[\p{L}\p{N}]/u.test(letters[i].ch)) letters[i].fromEnd = n++;
      }
    }
  }
  const r = el.getBoundingClientRect();
  const headline: Headline & { el: HTMLElement; words: ClipWord[] } = {
    el,
    words,
    letters,
    em: parseFloat(getComputedStyle(el).fontSize),
    box: { l: r.left - pageBox.left, r: r.right - pageBox.left, t: r.top - pageBox.top, b: r.bottom - pageBox.top },
  };
  return headline;
}

const TEXT_BLOCKS = new Set(["P", "H3", "H4", "DT", "DD", "BLOCKQUOTE", "FIGCAPTION"]);

/**
 * Everything a link must keep off, padded, in page coordinates. Text and
 * controls are hard; photos and portraits are soft: opaque, so a link may run
 * behind one when there is no clear way round.
 */
/** a headline's lines of text, as padded boxes, so a ragged right edge stays free */
function headlineRows(h: Headline, pad: number): Box[] {
  const rows = new Map<number, Box>();
  for (const { box, baseline } of h.letters) {
    const key = Math.round(baseline);
    const row = rows.get(key);
    rows.set(
      key,
      row
        ? { l: Math.min(row.l, box.l), r: Math.max(row.r, box.r), t: Math.min(row.t, box.t), b: Math.max(row.b, box.b) }
        : { ...box },
    );
  }
  return [...rows.values()].map((r) => ({ l: r.l - pad, r: r.r + pad, t: r.t - pad, b: r.b + pad }));
}

function readObstacles(pageBox: DOMRect, width: number, pad: number): Box[] {
  const boxes: Box[] = [];
  const range = document.createRange();
  const add = (el: HTMLElement, soft: boolean) => {
    // a drawing's hover card sits over the drawing only while it is shown
    if (el.closest(HEADLINES) || el.closest(".doodle-box, .scene-tip")) return;
    let rects: DOMRect[];
    const style = getComputedStyle(el);
    const boxed = style.borderTopWidth !== "0px" || style.backgroundColor !== "rgba(0, 0, 0, 0)";
    if (!soft && (TEXT_BLOCKS.has(el.tagName) || (el.tagName === "LI" && !boxed))) {
      // text: its line boxes, so a ragged right edge stays free
      range.selectNodeContents(el);
      rects = [...range.getClientRects()];
      // ...but not screen-reader text: clipped to nothing on screen, its
      // unclipped line boxes still run on past the right edge and close the margin lane
      const hidden: DOMRect[] = [];
      for (const sr of el.querySelectorAll<HTMLElement>(".sr-only")) {
        range.selectNodeContents(sr);
        hidden.push(sr.getBoundingClientRect(), ...range.getClientRects());
      }
      if (hidden.length) {
        const same = (a: DOMRect, b: DOMRect) =>
          Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.right - b.right) < 0.5;
        rects = rects.filter((r) => !hidden.some((h) => same(r, h)));
      }
    } else rects = [el.getBoundingClientRect()];
    for (const rect of rects) {
      const l = Math.max(rect.left, 0);
      const r = Math.min(rect.right, pageBox.left + width);
      const t = rect.top;
      const b = rect.bottom;
      if (r - l < 1 || b - t < 1) continue;
      boxes.push({
        l: l - pageBox.left - pad,
        r: r - pageBox.left + pad,
        t: t - pageBox.top - pad,
        b: b - pageBox.top + pad,
        soft,
      });
    }
  };
  for (const el of document.querySelectorAll<HTMLElement>(OBSTACLES)) add(el, false);
  for (const el of document.querySelectorAll<HTMLElement>(MEDIA)) add(el, true);
  return boxes;
}

export function InkLine() {
  const backRef = useRef<SVGSVGElement>(null);
  const frontRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const backEl = backRef.current;
    const frontEl = frontRef.current;
    const pageEl = backEl?.parentElement;
    if (!backEl || !frontEl || !pageEl) return;
    // typed non-null for the function declarations below
    const back: SVGSVGElement = backEl;
    const front: SVGSVGElement = frontEl;
    const page: HTMLElement = pageEl;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /**
     * The scroll position and viewport height, kept from the scroll and resize
     * events: reading them (or any box) in a frame, after the loader or GSAP
     * has just set styles, forces a layout every frame and stutters on a phone.
     */
    const view = { y: window.scrollY, h: window.innerHeight };

    const svg =<K extends keyof SVGElementTagNameMap>(
      tag: K,
      attrs: Record<string, string | number> = {},
      parent?: Element,
    ): SVGElementTagNameMap[K] => {
      const el = document.createElementNS(SVG_NS, tag);
      for (const name in attrs) el.setAttribute(name, String(attrs[name]));
      parent?.appendChild(el);
      return el;
    };
    const round = { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };

    // back: halo, black line, labels
    const glowLayer = svg("g", { ...round, class: "ink-glow" }, back);
    const backLayer = svg("g", { ...round, stroke: "currentColor" }, back);
    const labelLayer = svg("g", { class: "ink-labels" }, back);
    // front: the same line over the headlines, clipped to their glyphs: the
    // brand gradient over the dark letters, plain ink over the gradient ones
    const defs = svg("defs", {}, front);
    const gradient = svg(
      "linearGradient",
      { id: "ink-grad", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: 170, y2: 0, spreadMethod: "reflect" },
      defs,
    );
    for (const [offset, color] of GRADIENT_STOPS) svg("stop", { offset, "stop-color": color }, gradient);
    const darkClip = svg("clipPath", { id: "ink-clip", clipPathUnits: "userSpaceOnUse" }, defs);
    const gradClip = svg("clipPath", { id: "ink-clip-grad", clipPathUnits: "userSpaceOnUse" }, defs);
    const frontLayer = svg("g", { ...round, stroke: "url(#ink-grad)", "clip-path": "url(#ink-clip)" }, front);
    const frontInkLayer = svg("g", { ...round, stroke: "currentColor", "clip-path": "url(#ink-clip-grad)" }, front);

    const line = {
      pieces: [] as Piece[],
      total: 0,
      /** length drawn on screen, easing toward the target */
      shown: 0,
      /** 0..1 of the hero cow drawn by pointer travel */
      pointer: 0,
      lastX: null as number | null,
      lastY: 0,
      lastT: performance.now(),
      animating: false,
      /** scrolled away from the hero since the cow was last reset */
      away: false,
      labels: [] as Reveal[],
      finale: null as Finale | null,
    };

    let drawFrame = 0;
    const requestDraw = () => {
      if (drawFrame) return;
      if (!line.animating) line.lastT = performance.now() - 16;
      drawFrame = requestAnimationFrame(draw);
    };

    /* ── layout: measure the boxes and rebuild every path ─────────────────── */
    // Every read comes first and every write after, and the lengths are worked
    // out rather than measured: so the page lays out once, after, not once per path.
    function layout() {
      const pageBox = page.getBoundingClientRect();
      view.y = window.scrollY;
      view.h = window.innerHeight;
      // the page's own box: its scroll size would include these SVGs, which
      // would then never shrink when the window does
      const width = page.clientWidth;
      const height = page.clientHeight;
      // the gradient repeats every button-width, so a crossing reads like the CTA
      const button = document.querySelector(".nav-cta, .btn");
      const buttonWidth = button ? button.getBoundingClientRect().width : 170;

      const placed: Placed[] = [...document.querySelectorAll<HTMLElement>(".doodle-box")].map((box) => {
        const scene: InkScene = SCENES[box.dataset.scene as SceneName];
        const r = box.getBoundingClientRect();
        const scale = Math.min(r.width / scene.w, r.height / scene.h);
        const left = r.left - pageBox.left + (r.width - scene.w * scale) / 2;
        const top = r.top - pageBox.top + (r.height - scene.h * scale) / 2;
        const map = (x: number, y: number): Point => [left + x * scale, top + y * scale];
        // beside the copy, the link joins the drawing where its lead-in ends
        const beside = r.left - pageBox.left > width * 0.3;
        const own = sceneRun(scene, scene.lead && beside ? scene.lead : 0);
        const nums = own.nums.map((v, k) => tenth(k % 2 ? top + v * scale : left + v * scale));
        const n = own.nums.length;
        return {
          box,
          scene,
          scale,
          map,
          run: { nums, lengths: own.lengths.map((l) => l * scale) },
          start: map(own.nums[0], own.nums[1]),
          startDir: [own.nums[2] - own.nums[0], own.nums[3] - own.nums[1]] as Point,
          end: map(own.nums[n - 2], own.nums[n - 1]),
          beside,
          enterY: ((beside && box.closest("section")) || box).getBoundingClientRect().top + view.y,
          topY: r.top + view.y,
          bottomY: r.bottom + view.y,
          interactive: box.dataset.interactive === "1",
          glow: box.dataset.glow === "1",
        };
      });

      // one stroke weight for the whole line, from the body text
      const bodyText = document.querySelector(".body") ?? document.body;
      const stroke = Math.min(
        STROKE_MAX,
        Math.max(STROKE_MIN, parseFloat(getComputedStyle(bodyText).fontSize) * STROKE_EM),
      );

      // the headlines, letter by letter, and what the links keep clear of
      const measure = document.createElement("canvas").getContext("2d")!;
      const glyphs = new Map<string, TextMetrics>();
      const headlines = [...document.querySelectorAll<HTMLElement>(HEADLINES)].map((el) =>
        readHeadline(el, pageBox, measure, glyphs),
      );
      const obstacles = readObstacles(pageBox, width, Math.max(8, stroke * 3));
      // the links go round the headlines, never through them: each line of a headline, padded like the copy
      const headlineLines = headlines.flatMap((h) => headlineRows(h, Math.max(8, stroke * 3)));
      const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      // where the front copies can show: round each headline, with room for glyphs that overhang it
      const glyphZones = headlines.map(({ box, em }) => {
        const pad = em * 0.35 + stroke * 2;
        return { l: box.l - pad, r: box.r + pad, t: box.t - pad, b: box.b + pad };
      });

      /* writes from here on */
      for (const el of [back, front]) {
        el.setAttribute("width", String(width));
        el.setAttribute("height", String(height));
        el.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }
      gradient.setAttribute("x2", Math.max(120, buttonWidth).toFixed(0));
      backLayer.setAttribute("stroke-width", stroke.toFixed(2));
      frontLayer.setAttribute("stroke-width", (stroke * 1.25).toFixed(2));
      frontInkLayer.setAttribute("stroke-width", stroke.toFixed(2));
      glowLayer.setAttribute("stroke-width", (stroke * 3.5).toFixed(1));
      // the glow blur and the label halo follow the stroke
      for (const el of [back, front]) el.style.setProperty("--ink-w", `${stroke.toFixed(2)}px`);
      for (const layer of [backLayer, frontLayer, frontInkLayer, glowLayer]) layer.replaceChildren();

      const pieces: Piece[] = [];
      let offset = 0;
      const addStroke = ({ nums, lengths }: Run, withGlow: boolean): Stroke => {
        const backGroup = svg("g", {}, backLayer);
        let frontGroups: SVGGElement[] | null = null;
        const chunks: Chunk[] = [];
        const ds: string[] = [];
        let at = 0;
        for (let i = 0; i < lengths.length; ) {
          // segments until the chunk is CHUNK long, and its bounds (the curves stay inside their control points)
          const from = i;
          let length = 0;
          let d = `M${nums[from * 6]},${nums[from * 6 + 1]}`;
          let l = nums[from * 6];
          let r = l;
          let t = nums[from * 6 + 1];
          let b = t;
          while (i < lengths.length && (i === from || length < CHUNK)) {
            const o = i * 6 + 2;
            d += ` C${nums[o]},${nums[o + 1]} ${nums[o + 2]},${nums[o + 3]} ${nums[o + 4]},${nums[o + 5]}`;
            for (let k = o; k < o + 6; k += 2) {
              l = Math.min(l, nums[k]);
              r = Math.max(r, nums[k]);
              t = Math.min(t, nums[k + 1]);
              b = Math.max(b, nums[k + 1]);
            }
            length += lengths[i++];
          }
          const paths = [svg("path", { d }, backGroup)];
          if (glyphZones.some((z) => l < z.r && r > z.l && t < z.b && b > z.t)) {
            frontGroups ??= [svg("g", {}, frontLayer), svg("g", {}, frontInkLayer)];
            for (const g of frontGroups) paths.push(svg("path", { d }, g));
          }
          for (const path of paths) path.style.visibility = "hidden";
          chunks.push({ paths, at, length, state: HIDDEN, drawn: 0 });
          if (withGlow) ds.push(d);
          at += length;
        }
        const added: Stroke = {
          groups: [backGroup, ...(frontGroups ?? [])],
          chunks,
          glow: withGlow ? svg("path", { d: ds.join(" ") }, glowLayer) : null,
          glowOn: false,
          length: at,
          offset,
          drawn: -1,
        };
        offset += at;
        return added;
      };
      const runOf = (d: string): Run => {
        const nums = parsePath(d);
        return { nums, lengths: segmentLengths(nums) };
      };
      placed.forEach((p, i) => {
        if (i > 0) {
          // from the previous scene's end, through every headline in between, into this one's start
          const previous = placed[i - 1];
          // straight runs with rounded corners, not sweeping curves; the run
          // across goes above the drawing, down just clear of its left-most
          // stroke (grass leaves reach past the start) and in along the
          // ground, never sideways through the picture
          const clear = Math.max(12, stroke * 4);
          const left = sampleCurve(p.run.nums, 12).reduce((m, q) => Math.min(m, q[0]), p.start[0]) - clear;
          const above: Point = [left, p.map(0, 0)[1] - clear];
          const over = previous.end[1] < above[1] && p.start[1] > above[1];
          const ctx = { obstacles: [...obstacles, ...headlineLines], width, straight: true };
          const way = over ? route(previous.end, above, [], ctx) : route(previous.end, p.start, [], ctx, p.startDir);
          if (over) {
            const turn = Math.min(clear * 2, p.start[0] - left);
            way.push({ p: [left, p.start[1] - turn], dir: [0, 1] }, { p: p.start, dir: [1, 0] });
          }
          const link = addStroke(runOf(pathData(way, true)), false);
          pieces.push({ kind: "link", ...link });
        }
        // the hero: the line begins as the tail of the title's last letter and
        // runs through its full stop into the drawing
        let run = p.run;
        const title = i === 0 ? headlines.filter((h) => follows(h.el, p.box)).pop() : undefined;
        if (title) {
          const stitch = heroStitch(title, p.start, p.startDir, obstacles, width, sampleCurve(p.run.nums), stroke);
          if (stitch && stitch.length > 1) {
            const lead = runOf(pathData(stitch));
            run = { nums: lead.nums.concat(p.run.nums.slice(2)), lengths: lead.lengths.concat(p.run.lengths) };
          }
        }
        pieces.push({ kind: "scene", placed: p, ...addStroke(run, p.glow) });
      });
      line.pieces = pieces;
      line.total = offset;
      // reduced motion: the whole line, at once
      line.shown = still ? offset : Math.min(line.shown, offset);

      // labels and the finale logo
      labelLayer.replaceChildren();
      line.labels = [];
      line.finale?.el.remove();
      line.finale = null;
      pieces.forEach((piece) => {
        if (piece.kind !== "scene") return;
        const { scene, scale, map } = piece.placed;
        for (const label of scene.labels ?? []) {
          const [x, y] = map(label.x, label.y);
          const text = svg(
            "text",
            {
              x: x.toFixed(1),
              y: y.toFixed(1),
              "text-anchor": label.anchor || "middle",
              class: "ink-label",
              "font-size": Math.max(11, label.size * scale).toFixed(1),
              "font-weight": label.weight || 400,
            },
            labelLayer,
          );
          text.textContent = label.text;
          if (label.deco) text.style.textDecoration = label.deco;
          line.labels.push({ el: text, at: piece.offset + piece.length * (label.at ?? 1), on: false });
        }
        if (scene.logo) {
          const [lx, ly, lw, lh] = scene.logo;
          const [x, y] = map(lx, ly);
          const logo = svg(
            "image",
            {
              href: brand.logo,
              x: x.toFixed(1),
              y: y.toFixed(1),
              width: (lw * scale).toFixed(1),
              height: (lh * scale).toFixed(1),
              class: "ink-finale",
              preserveAspectRatio: "xMidYMid meet",
            },
            front,
          );
          line.finale = {
            el: logo,
            at: piece.offset + piece.length - 2,
            on: false,
            handover: piece.groups,
          };
        }
      });

      // the clips: every headline word re-set as SVG text over its own box
      darkClip.replaceChildren();
      gradClip.replaceChildren();
      for (const headline of headlines) {
        for (const word of headline.words) {
          const text = svg(
            "text",
            {
              x: word.x.toFixed(1),
              y: word.baseline.toFixed(1),
              "font-family": word.family,
              "font-size": word.size,
              "font-weight": word.weight,
              textLength: word.width.toFixed(1),
              lengthAdjust: "spacingAndGlyphs",
            },
            word.grad ? gradClip : darkClip,
          );
          text.textContent = word.text;
        }
      }

      // draw straight away, so the new paths are never shown blank for a frame
      cancelAnimationFrame(drawFrame);
      if (!line.animating) line.lastT = performance.now() - 16;
      draw();
    }

    /* ── progress: how much line the page position asks for ───────────────── */
    /** how far each drawing has played (0..1), by its box; kept across layouts */
    const plays = new Map<HTMLElement, { f: number; on: boolean }>();
    const playOf = (box: HTMLElement) => {
      let p = plays.get(box);
      if (!p) plays.set(box, (p = { f: 0, on: false }));
      return p;
    };
    /**
     * A drawing has started to come into view: beside its copy, when its
     * section's top is above ENTER of the screen; stacked under the copy (a
     * phone), when its own top is, or it would play out of sight while the
     * copy above it is read. From positions measured in layout(), never a box.
     */
    const entered = ({ enterY }: Placed) => enterY - view.y <= view.h * ENTER;
    function target() {
      const head = view.y + view.h * HEAD;
      // scrolled back above a drawing: it plays again from the start next time
      for (const piece of line.pieces) {
        if (piece.kind !== "scene" || piece.placed.interactive) continue;
        const p = playOf(piece.placed.box);
        if (p.on && !entered(piece.placed)) {
          gsap.killTweensOf(p);
          p.f = 0;
          p.on = false;
        }
      }
      let length = 0;
      for (const piece of line.pieces) {
        let f: number;
        if (piece.kind === "link") {
          // once the drawing above is done, the line runs on to the next one
          // and waits there, rather than stopping part way down the screen
          f = 1;
        } else if (piece.placed.interactive) {
          // back at the very top after scrolling away: the cow starts over
          if (view.y <= 2 && line.away) {
            line.pointer = 0;
            line.lastX = null;
            line.away = false;
            if (selfDraws) selfDraw();
          }
          if (view.y > 40) line.away = true;
          f = Math.max(view.y / (view.h * HERO_SCROLL), line.pointer);
        } else {
          // the line has reached the drawing and its section is in view: it plays straight through
          const p = playOf(piece.placed.box);
          if (!p.on && entered(piece.placed)) {
            p.on = true;
            gsap.to(p, { f: 1, duration: PLAY, ease: "power1.inOut", onUpdate: requestDraw });
          }
          // scrolled on past it (a jump down the page): it is done, so the line runs on
          if (p.f < 1 && piece.placed.bottomY < head) {
            gsap.killTweensOf(p);
            p.f = 1;
          }
          f = p.f;
        }
        f = Math.max(0, Math.min(1, f));
        length += piece.length * f;
        // the line is continuous: nothing below an unfinished piece is drawn
        if (f < 1) break;
      }
      return length;
    }

    /* ── drawing ──────────────────────────────────────────────────────────── */
    function draw() {
      drawFrame = 0;
      const now = performance.now();
      const goal = still ? line.total : target();
      const ease = Math.min(1, Math.min((now - line.lastT) / 1000, 0.25) * 9);
      line.lastT = now;
      line.shown += (goal - line.shown) * ease;
      line.animating = Math.abs(goal - line.shown) >= 0.5;
      if (line.animating) requestDraw();
      else line.shown = goal;

      for (const piece of line.pieces) {
        const drawn = Math.max(0, Math.min(piece.length, line.shown - piece.offset));
        if (drawn === piece.drawn) continue;
        piece.drawn = drawn;
        // only the chunks whose state changes are touched: in a frame, that is the one under the pen
        for (const chunk of piece.chunks) {
          const part = Math.max(0, Math.min(chunk.length, drawn - chunk.at));
          const state = part <= 0 ? HIDDEN : part >= chunk.length ? FULL : PART;
          if (state === chunk.state && (state !== PART || Math.abs(part - chunk.drawn) < 0.25)) continue;
          for (const path of chunk.paths) {
            const { style } = path;
            if (state === HIDDEN) style.visibility = "hidden";
            else if (state === FULL) {
              style.visibility = "";
              style.strokeDasharray = "";
              style.strokeDashoffset = "";
            } else {
              if (chunk.state !== PART) {
                style.visibility = "";
                style.strokeDasharray = `${chunk.length + 1} ${chunk.length + 1}`;
              }
              style.strokeDashoffset = `${chunk.length + 1 - part}`;
            }
          }
          chunk.state = state;
          chunk.drawn = part;
        }
        const glowOn = drawn >= piece.length - 0.5;
        if (piece.glow && glowOn !== piece.glowOn) piece.glow.classList.toggle("is-on", glowOn);
        piece.glowOn = glowOn;
      }
      for (const label of line.labels) {
        const on = line.shown >= label.at;
        if (on !== label.on) label.el.style.opacity = on ? "1" : "0";
        label.on = on;
      }
      if (line.finale) {
        const arrived = line.shown >= line.finale.at;
        if (arrived !== line.finale.on) {
          line.finale.el.classList.toggle("is-on", arrived);
          for (const group of line.finale.handover) group.classList.toggle("ink-handover", arrived);
        }
        line.finale.on = arrived;
      }
    }

    /* ── the hero cow follows the pointer ─────────────────────────────────── */
    // pointer moves over the loader would draw it unseen: listen from the reveal on
    let pointerLive = false;
    // the cow draws itself once the page opens, and again on each return to the
    // top, so it is never left half-drawn waiting for the pointer to move
    const selfDraws = !still;
    function selfDraw(delay = 0.3) {
      gsap.killTweensOf(line);
      gsap.to(line, { pointer: 1, duration: SELF_DRAW, delay, ease: "power1.inOut", onUpdate: requestDraw });
    }
    // on the reveal, once the loader's circle is mostly open (it opens over
    // 1.2 s), so the two never compete for the same frames on a phone
    const stopWaiting = whenRevealed(() => {
      pointerLive = true;
      if (selfDraws) selfDraw(OPEN_DELAY);
    });
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerLive || line.pointer >= 1) return;
      const hero = line.pieces.find((p) => p.kind === "scene" && p.placed.interactive);
      if (!hero || hero.kind !== "scene") return;
      // from the layout, not the box: a read here would force a layout per move
      if (hero.placed.bottomY < view.y || hero.placed.topY > view.y + view.h) return;
      if (line.lastX !== null) {
        line.pointer = Math.min(1, line.pointer + Math.hypot(e.clientX - line.lastX, e.clientY - line.lastY) / POINTER_TRAVEL);
        requestDraw();
      }
      line.lastX = e.clientX;
      line.lastY = e.clientY;
    };

    let layoutFrame = 0;
    let disposed = false;
    /** laid out at least once: until then the resizes wait for the first layout */
    let ready = false;
    /** the page size the line was last laid out for */
    let laidOut = "";
    const pageSize = () => `${page.clientWidth}x${page.clientHeight}`;
    // a resize that leaves the page the same size (a phone's address bar
    // showing or hiding) changes nothing the line depends on
    const requestLayout = (force?: unknown) => {
      if (disposed || !ready || (force !== true && pageSize() === laidOut)) return;
      cancelAnimationFrame(layoutFrame);
      layoutFrame = requestAnimationFrame(() => {
        laidOut = pageSize();
        layout();
      });
    };
    // the view is read here, in the events, and only used in the frames
    const onScroll = () => {
      view.y = window.scrollY;
      requestDraw();
    };
    const onResize = () => {
      view.h = window.innerHeight;
      requestLayout();
      requestDraw();
    };
    const resizes = new ResizeObserver(requestLayout);
    resizes.observe(page);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!still) window.addEventListener("pointermove", onPointerMove, { passive: true });
    const firstLayout = () => {
      if (disposed || ready) return;
      ready = true;
      laidOut = pageSize();
      layout();
      markInkReady();
    };
    // (App fires the reveal after this mounts when there is no loader, so look for it)
    if (isRevealed() || !document.querySelector(".loader") || !document.fonts) {
      // no loader over the page: lay out now, and again when the webfonts
      // land (the headline glyph boxes move)
      firstLayout();
      document.fonts?.ready.then(() => requestLayout(true));
    } else {
      // the loader covers the page until the webfonts are in, and its first
      // frame waits for this layout: one layout, before anything moves,
      // rather than one now and another part way through the loader
      document.fonts.ready.then(firstLayout, firstLayout);
    }

    return () => {
      disposed = true;
      stopWaiting();
      gsap.killTweensOf(line);
      resizes.disconnect();
      cancelAnimationFrame(drawFrame);
      cancelAnimationFrame(layoutFrame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      back.replaceChildren();
      front.replaceChildren();
    };
  }, []);

  return (
    <>
      <svg ref={backRef} className="ink ink--back" aria-hidden="true" />
      <svg ref={frontRef} className="ink ink--front" aria-hidden="true" />
    </>
  );
}
