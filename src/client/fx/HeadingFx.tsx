import { useEffect } from "react";
import "./headings.css";

const TARGETS =
  ".hero-title, .display, .leader h3, .advisors h3, .partners h3, .contact-title, .footer-tag";

function getHeadingTarget(target: Element | null): HTMLElement | null {
  if (!target) return null;
  const direct = target.closest<HTMLElement>(TARGETS);
  if (direct) return direct;
  // If pointer is over a section kicker above a heading, target that heading
  const kicker = target.closest<HTMLElement>(".kicker");
  if (kicker) {
    const parent = kicker.parentElement;
    const heading = parent?.querySelector<HTMLElement>(".hero-title, .display");
    if (heading) return heading;
  }
  return null;
}

interface State {
  x: number;
  y: number;
  l: number; // smoothed pointer position (-1..1) and hover intensity (0..1)
  tx: number;
  ty: number;
  tl: number;
}

/** Pointer-reactive 3D hover for headings: one delegated listener, rAF-eased CSS variables. */
export function HeadingFx() {
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!mq.matches) return;
    const states = new Map<HTMLElement, State>();
    let raf = 0;

    const tick = () => {
      raf = 0;
      for (const [el, s] of states) {
        const k = s.tl ? 0.22 : 0.14; // follow quickly, release gently
        s.x += (s.tx - s.x) * k;
        s.y += (s.ty - s.y) * k;
        s.l += (s.tl - s.l) * k;
        if (!s.tl && s.l < 0.01) {
          el.removeAttribute("data-hfx");
          for (const v of ["--hx", "--hy", "--hl"]) el.style.removeProperty(v);
          states.delete(el);
          continue;
        }
        el.style.setProperty("--hx", s.x.toFixed(3));
        el.style.setProperty("--hy", s.y.toFixed(3));
        el.style.setProperty("--hl", s.l.toFixed(3));
      }
      if (states.size) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const release = (el: HTMLElement) => {
      const s = states.get(el);
      if (s) s.tl = 0;
    };

    let active: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = getHeadingTarget(e.target as Element | null);
      if (el !== active) {
        if (active) release(active);
        active = el;
      }
      if (!el) return kick();
      const r = el.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / (r.width || 1)) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / (r.height || 1)) * 2 - 1));
      let s = states.get(el);
      if (!s) {
        s = { x: nx, y: ny, l: 0, tx: nx, ty: ny, tl: 1 };
        states.set(el, s);
        el.dataset.hfx = "tilt";
      }
      s.tx = nx;
      s.ty = ny;
      s.tl = 1;
      kick();
    };
    const onLeave = () => {
      if (active) release(active);
      active = null;
      kick();
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      for (const el of states.keys()) el.removeAttribute("data-hfx");
    };
  }, []);

  return null;
}
