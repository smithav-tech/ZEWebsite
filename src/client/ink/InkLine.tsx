import { useEffect, useRef } from "react";
import gsap from "gsap";
import { brand } from "../content";
import { whenRevealed } from "../reveal";
import { pathData, reachTable, route, samplePath, type Box, type Headline, type Letter } from "./route";
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
 *   pieces. A link is drawn down to the drawing head (72% down the viewport),
 *   so it writes through each headline as the head passes it; a scene is
 *   drawn as the head moves down its box. The hero cow draws itself once the
 *   page opens (pointer travel or the first quarter-screen of scroll can
 *   finish it sooner).
 * - Drawing: the shown length eases toward that target each frame, and each
 *   path reveals its share through stroke-dashoffset. Labels fade in at their
 *   fraction of the stroke; the last scene can glow; the finale swaps the
 *   drawn wordmark for the logo image.
 * Reduced motion: everything is drawn at once and the pointer is ignored.
 */

/** the drawing head, as a fraction of the viewport height */
const HEAD = 0.72;
/** pointer travel (px) that draws the whole hero cow */
const POINTER_TRAVEL = 2200;
/** scrolling this fraction of a screen also completes the cow */
const HERO_SCROLL = 0.25;
/** the hero cow draws itself over this long (s) once the page opens */
const SELF_DRAW = 2.2;
/**
 * One stroke weight for the whole line, in every scene and link: a little
 * heavier than the stem of the body text (DM Sans stems are 0.085em), so it
 * scales with the type and is lighter on a phone.
 */
const STROKE_EM = 0.11;
const STROKE_MIN = 1.75;
const STROKE_MAX = 3;
/** a scene is complete once the head has passed this fraction of its box */
const DEFAULT_SPAN = 0.85;
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

const SVG_NS = "http://www.w3.org/2000/svg";
const NUM = String.raw`(-?\d*\.?\d+)`;
const ANY_POINT = new RegExp(`${NUM},${NUM}`, "g");
const FIRST_POINT = new RegExp(`^M${NUM},${NUM}`);
const LAST_POINT = new RegExp(`${NUM},${NUM}$`);
const FIRST_CONTROL = new RegExp(`^M${NUM},${NUM} C${NUM},${NUM}`);

/** a scene's path without its first `lead` segments, starting where they end */
function dropLead(d: string, lead: number) {
  const segments = d.split(" C").slice(1);
  if (lead >= segments.length) return d;
  const from = segments[lead - 1].trim().split(" ").pop();
  return `M${from} C${segments.slice(lead).join(" C")}`;
}

type Point = [number, number];

/** a scene fitted into its box on the page */
interface Placed {
  box: HTMLElement;
  scene: InkScene;
  scale: number;
  /** scene units to page coordinates */
  map: (x: number, y: number) => Point;
  d: string;
  start: Point;
  /** the drawing's heading where it starts, so the link arrives along it */
  startDir: Point;
  end: Point;
  interactive: boolean;
  glow: boolean;
  span: number;
}

interface Stroke {
  back: SVGPathElement;
  /** the copies in front of the headlines: gradient over dark glyphs, ink over gradient ones */
  front: SVGPathElement[];
  glow: SVGPathElement | null;
  length: number;
  /** where this piece starts along the whole line */
  offset: number;
  /** length currently revealed (-1: never set) */
  drawn: number;
}

/** a link: `reach[i]` is the lowest page y the line gets to within its first i * REACH_STEP px */
type Piece = Stroke & ({ kind: "link"; reach: Float32Array } | { kind: "scene"; placed: Placed });

/** sampling step (px of line) for a link's reach table */
const REACH_STEP = 6;

interface Reveal {
  el: SVGElement;
  /** line length at which it shows */
  at: number;
}

interface Finale extends Reveal {
  /** the strokes that fade out as the logo arrives: the drawn wordmark (the link stays, ending in the logo) */
  handover: SVGPathElement[];
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
function readHeadline(el: HTMLElement, pageBox: DOMRect, measure: CanvasRenderingContext2D) {
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
        const glyph = measure.measureText(text[i]);
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
    if (el.closest(HEADLINES) || el.closest(".doodle-box")) return;
    let rects: DOMRect[];
    const style = getComputedStyle(el);
    const boxed = style.borderTopWidth !== "0px" || style.backgroundColor !== "rgba(0, 0, 0, 0)";
    if (!soft && (TEXT_BLOCKS.has(el.tagName) || (el.tagName === "LI" && !boxed))) {
      // text: its line boxes, so a ragged right edge stays free
      range.selectNodeContents(el);
      rects = [...range.getClientRects()];
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

    const svg = <K extends keyof SVGElementTagNameMap>(
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
    function layout() {
      const pageBox = page.getBoundingClientRect();
      const pageTop = pageBox.top + window.scrollY;
      // the page's own box: its scroll size would include these SVGs, which
      // would then never shrink when the window does
      const width = page.clientWidth;
      const height = page.clientHeight;
      for (const el of [back, front]) {
        el.setAttribute("width", String(width));
        el.setAttribute("height", String(height));
        el.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }

      // the gradient repeats every button-width, so a crossing reads like the CTA
      const button = document.querySelector(".nav-cta, .btn");
      gradient.setAttribute("x2", Math.max(120, button ? button.getBoundingClientRect().width : 170).toFixed(0));

      const placed: Placed[] = [...document.querySelectorAll<HTMLElement>(".doodle-box")].map((box) => {
        const scene: InkScene = SCENES[box.dataset.scene as SceneName];
        const r = box.getBoundingClientRect();
        const scale = Math.min(r.width / scene.w, r.height / scene.h);
        const left = r.left - pageBox.left + (r.width - scene.w * scale) / 2;
        const top = r.top - pageBox.top + (r.height - scene.h * scale) / 2;
        const map = (x: number, y: number): Point => [left + x * scale, top + y * scale];
        // beside the copy, the link joins the drawing where its lead-in ends
        const beside = r.left - pageBox.left > width * 0.3;
        const own = scene.lead && beside ? dropLead(scene.d, scene.lead) : scene.d;
        const d = own.replace(ANY_POINT, (_, x: string, y: string) => {
          const [px, py] = map(+x, +y);
          return `${px.toFixed(1)},${py.toFixed(1)}`;
        });
        const first = own.match(FIRST_POINT)!;
        const last = own.match(LAST_POINT)!;
        const [, , c1x, c1y] = own.match(FIRST_CONTROL)!.slice(1).map(Number);
        return {
          box,
          scene,
          scale,
          map,
          d,
          start: map(+first[1], +first[2]),
          startDir: [c1x - +first[1], c1y - +first[2]] as Point,
          end: map(+last[1], +last[2]),
          interactive: box.dataset.interactive === "1",
          glow: box.dataset.glow === "1",
          span: +(box.dataset.span || DEFAULT_SPAN),
        };
      });

      // one stroke weight for the whole line, from the body text
      const bodyText = document.querySelector(".body") ?? document.body;
      const stroke = Math.min(
        STROKE_MAX,
        Math.max(STROKE_MIN, parseFloat(getComputedStyle(bodyText).fontSize) * STROKE_EM),
      );
      backLayer.setAttribute("stroke-width", stroke.toFixed(2));
      frontLayer.setAttribute("stroke-width", (stroke * 1.25).toFixed(2));
      frontInkLayer.setAttribute("stroke-width", stroke.toFixed(2));
      glowLayer.setAttribute("stroke-width", (stroke * 3.5).toFixed(1));
      // the glow blur and the label halo follow the stroke
      for (const el of [back, front]) el.style.setProperty("--ink-w", `${stroke.toFixed(2)}px`);
      for (const layer of [backLayer, frontLayer, frontInkLayer, glowLayer]) layer.replaceChildren();

      // the headlines, letter by letter, and what the links keep clear of
      const measure = document.createElement("canvas").getContext("2d")!;
      const headlines = [...document.querySelectorAll<HTMLElement>(HEADLINES)].map((el) =>
        readHeadline(el, pageBox, measure),
      );
      const obstacles = readObstacles(pageBox, width, Math.max(8, stroke * 3));
      // the links go round the headlines, never through them: each line of a headline, padded like the copy
      const headlineLines = headlines.flatMap((h) => headlineRows(h, Math.max(8, stroke * 3)));
      const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

      const pieces: Piece[] = [];
      let offset = 0;
      const addStroke = (d: string, withGlow: boolean): Stroke => {
        const backPath = svg("path", { d }, backLayer);
        const front = [svg("path", { d }, frontLayer), svg("path", { d }, frontInkLayer)];
        const length = backPath.getTotalLength();
        for (const p of [backPath, ...front]) {
          p.style.strokeDasharray = `${length + 1} ${length + 1}`;
          p.style.strokeDashoffset = `${length + 1}`;
        }
        const added: Stroke = {
          back: backPath,
          front,
          glow: withGlow ? svg("path", { d }, glowLayer) : null,
          length,
          offset,
          drawn: -1,
        };
        offset += length;
        return added;
      };
      placed.forEach((p, i) => {
        if (i > 0) {
          // from the previous scene's end, through every headline in between, into this one's start
          const previous = placed[i - 1];
          // straight runs with rounded corners, not sweeping curves
          const way = route(previous.end, p.start, [], { obstacles: [...obstacles, ...headlineLines], width, straight: true }, p.startDir);
          // how far down the page the line has reached at each point along it
          const reach = reachTable(way, REACH_STEP, true).map((y) => y + pageTop);
          const link = addStroke(pathData(way, true), false);
          pieces.push({ kind: "link", reach, ...link });
        }
        // the hero: the line begins as the tail of the title's last letter and
        // runs through its full stop into the drawing
        let d = p.d;
        const title = i === 0 ? headlines.filter((h) => follows(h.el, p.box)).pop() : undefined;
        if (title) {
          const stitch = heroStitch(title, p.start, p.startDir, obstacles, width, samplePath(p.d), stroke);
          if (stitch && stitch.length > 1) d = `${pathData(stitch)} ${p.d.replace(/^M\S+\s*/, "")}`;
        }
        pieces.push({ kind: "scene", placed: p, ...addStroke(d, p.glow) });
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
          line.labels.push({ el: text, at: piece.offset + piece.length * (label.at ?? 1) });
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
            handover: [piece.back, ...piece.front],
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
    function target() {
      const head = window.scrollY + window.innerHeight * HEAD;
      let length = 0;
      for (const piece of line.pieces) {
        let f: number;
        if (piece.kind === "link") {
          // drawn down to the head: the first point where the line goes below it
          const { reach } = piece;
          let lo = 0;
          let hi = reach.length;
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (reach[mid] > head) hi = mid;
            else lo = mid + 1;
          }
          f = lo >= reach.length ? 1 : (lo * REACH_STEP) / piece.length;
        } else if (piece.placed.interactive) {
          // back at the very top after scrolling away: the cow starts over
          if (window.scrollY <= 2 && line.away) {
            line.pointer = 0;
            line.lastX = null;
            line.away = false;
            if (selfDraws) selfDraw();
          }
          if (window.scrollY > 40) line.away = true;
          f = Math.max(window.scrollY / (window.innerHeight * HERO_SCROLL), line.pointer);
        } else {
          const r = piece.placed.box.getBoundingClientRect();
          f = (head - (r.top + window.scrollY)) / (r.height * piece.placed.span);
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
        if (Math.abs(drawn - piece.drawn) < 0.25) continue;
        piece.drawn = drawn;
        const dash = `${piece.length + 1 - drawn}`;
        piece.back.style.strokeDashoffset = dash;
        for (const path of piece.front) path.style.strokeDashoffset = dash;
        piece.glow?.classList.toggle("is-on", drawn >= piece.length - 0.5);
      }
      for (const label of line.labels) label.el.style.opacity = line.shown >= label.at ? "1" : "0";
      if (line.finale) {
        const arrived = line.shown >= line.finale.at;
        line.finale.el.classList.toggle("is-on", arrived);
        for (const path of line.finale.handover) path.classList.toggle("ink-handover", arrived);
      }
    }

    /* ── the hero cow follows the pointer ─────────────────────────────────── */
    // pointer moves over the loader would draw it unseen: listen from the reveal on
    let pointerLive = false;
    // the cow draws itself once the page opens, and again on each return to the
    // top, so it is never left half-drawn waiting for the pointer to move
    const selfDraws = !still;
    function selfDraw() {
      gsap.killTweensOf(line);
      gsap.to(line, { pointer: 1, duration: SELF_DRAW, delay: 0.3, ease: "power1.inOut", onUpdate: requestDraw });
    }
    const stopWaiting = whenRevealed(() => {
      pointerLive = true;
      if (selfDraws) selfDraw();
    });
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerLive || line.pointer >= 1) return;
      const hero = line.pieces.find((p) => p.kind === "scene" && p.placed.interactive);
      if (!hero || hero.kind !== "scene") return;
      const r = hero.placed.box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      if (line.lastX !== null) {
        line.pointer = Math.min(1, line.pointer + Math.hypot(e.clientX - line.lastX, e.clientY - line.lastY) / POINTER_TRAVEL);
        requestDraw();
      }
      line.lastX = e.clientX;
      line.lastY = e.clientY;
    };

    let layoutFrame = 0;
    let disposed = false;
    /** the page size the line was last laid out for */
    let laidOut = "";
    const pageSize = () => `${page.clientWidth}x${page.clientHeight}`;
    // a resize that leaves the page the same size (a phone's address bar
    // showing or hiding) changes nothing the line depends on
    const requestLayout = (force?: unknown) => {
      if (disposed || (force !== true && pageSize() === laidOut)) return;
      cancelAnimationFrame(layoutFrame);
      layoutFrame = requestAnimationFrame(() => {
        laidOut = pageSize();
        layout();
      });
    };
    const resizes = new ResizeObserver(requestLayout);
    resizes.observe(page);
    window.addEventListener("resize", requestLayout);
    window.addEventListener("scroll", requestDraw, { passive: true });
    if (!still) window.addEventListener("pointermove", onPointerMove, { passive: true });
    laidOut = pageSize();
    layout();
    // headline glyph boxes move when the webfonts land
    document.fonts?.ready.then(() => requestLayout(true));

    return () => {
      disposed = true;
      stopWaiting();
      gsap.killTweensOf(line);
      resizes.disconnect();
      cancelAnimationFrame(drawFrame);
      cancelAnimationFrame(layoutFrame);
      window.removeEventListener("resize", requestLayout);
      window.removeEventListener("scroll", requestDraw);
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
