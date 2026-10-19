import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SCENES, type SceneName } from "../ink/scenes";
import "./depth.css";

/**
 * The page-wide 3D depth layer, under the ink line. Every doodle stands on a
 * tilted, dotted milk board (a slab with a contact shadow) that leans a little
 * toward the pointer.
 *
 * Nothing in `main` is moved: the layer only measures the doodle boxes (the
 * same boxes InkLine reads) and lays its boards out under them.
 * It is page-sized, clipped, and never changes `.page`'s size.
 */

/**
 * Where each drawing stands, in its scene's units: the board's centre line `y`
 * (where the feet or the base of the drawing meet it), its extent `x0`..`x1`,
 * how deep it is for its width, and a faint brand tint.
 */
const STANDS: Record<string, { x0: number; x1: number; y: number; depth?: number; tint?: string }> = {
  cow: { x0: 90, x1: 1290, y: 772 },
  methane: { x0: 80, x1: 580, y: 546, tint: "var(--lime)" },
  feed: { x0: 10, x1: 640, y: 390, depth: 0.6, tint: "var(--green)" },
  energy: { x0: 30, x1: 630, y: 372, depth: 0.46, tint: "var(--orange)" },
  corridor: { x0: 40, x1: 600, y: 500, tint: "var(--teal)" },
  gramcarbon: { x0: 50, x1: 560, y: 450, tint: "var(--cyan)" },
  offsets: { x0: 20, x1: 590, y: 568, tint: "var(--purple)" },
};

/** board depth (before the tilt) as a fraction of its width */
const BOARD_DEPTH = 0.4;

interface Floor {
  key: string;
  x: number;
  y: number;
  w: number;
  depth: number;
  tint?: string;
}

/** measure the doodles and lay out a floor under each */
function measure(page: HTMLElement) {
  const pageBox = page.getBoundingClientRect();
  const width = page.clientWidth;

  // the floors: one under every drawing, fitted the way InkLine fits the scene
  const floors: Floor[] = [];
  for (const box of page.querySelectorAll<HTMLElement>(".doodle-box")) {
    const name = box.dataset.scene as SceneName;
    const scene = SCENES[name];
    const stand = STANDS[name];
    if (!scene || !stand) continue;
    const r = box.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const scale = Math.min(r.width / scene.w, r.height / scene.h);
    const left = r.left - pageBox.left + (r.width - scene.w * scale) / 2;
    const top = r.top - pageBox.top + (r.height - scene.h * scale) / 2;
    const w = (stand.x1 - stand.x0) * scale;
    const depth = stand.depth ?? BOARD_DEPTH;
    const y = top + stand.y * scale;
    floors.push({ key: `${name}-${floors.length}`, x: left + ((stand.x0 + stand.x1) / 2) * scale, y, w, depth, tint: stand.tint });
  }

  return { floors, size: `${width}x${page.clientHeight}` };
}

type Layout = ReturnType<typeof measure>;

function FloorView({ floor }: { floor: Floor }) {
  const d = floor.w * floor.depth;
  const style = {
    left: floor.x - floor.w / 2,
    top: floor.y - d / 2,
    width: floor.w,
    height: d,
    "--u": `${(floor.w / 100).toFixed(2)}px`,
    "--tint": floor.tint ?? "var(--milk)",
  } as CSSProperties;
  return (
    <div className="depth-floor" style={style}>
      <i className="depth-floor-shadow" />
      <div className="depth-board" />
    </div>
  );
}

export function Depth() {
  const root = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);

  // measure at load, on resize and when the webfonts land
  useEffect(() => {
    const el = root.current;
    const page = el?.parentElement;
    if (!el || !page) return;
    let frame = 0;
    let last = "";
    const request = (force?: unknown) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = measure(page);
        if (force !== true && next.size === last) return;
        last = next.size;
        setLayout(next);
      });
    };
    const sizes = new ResizeObserver(request);
    sizes.observe(page);
    window.addEventListener("resize", request);
    document.fonts?.ready.then(() => request(true));
    request(true);
    return () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      window.removeEventListener("resize", request);
    };
  }, []);

  // the floors settle in, then lean toward the pointer: one rAF loop, awake only while it moves
  useEffect(() => {
    const el = root.current;
    if (!el || !layout) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // the floors fade and settle in once they are on screen
    const settle: number[] = [];
    const floorsIn = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const floor = e.target;
          floor.classList.add("is-in");
          floorsIn.unobserve(floor);
          // once it has settled, the lean follows the pointer without a transition
          settle.push(window.setTimeout(() => floor.classList.add("is-settled"), 1300));
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    for (const f of el.querySelectorAll(".depth-floor")) floorsIn.observe(f);

    if (still || !hover) {
      return () => {
        floorsIn.disconnect();
        settle.forEach(clearTimeout);
      };
    }

    let frame = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const draw = () => {
      frame = 0;
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      const settling = Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 0.002;
      if (!settling) return;
      // the floors lean a degree or two toward the pointer
      el.style.setProperty("--lean-x", `${(pointer.y * -3).toFixed(2)}deg`);
      el.style.setProperty("--lean-z", `${(pointer.x * 2.4).toFixed(2)}deg`);
      request();
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const onPointer = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
      request();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      floorsIn.disconnect();
      settle.forEach(clearTimeout);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [layout]);

  return (
    <div className="depth" ref={root} aria-hidden="true">
      {layout?.floors.map((f) => <FloorView key={f.key} floor={f} />)}
    </div>
  );
}
