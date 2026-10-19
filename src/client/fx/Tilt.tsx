import { useEffect } from "react";
import "./tilt.css";

/** Peak tilt (deg) at the card's edge. */
const MAX_TILT = 8;

/** Groups below the ink line whose items fly in from depth when they scroll into view. */
const ENTER_GROUPS = [".team .leaders", ".advisors ul", ".projects .leaders"];

/**
 * One delegated pointer handler tilts every [data-tilt] element toward the
 * pointer (rotateX/rotateY and a glare spot), written as CSS variables once
 * per frame; tilt.css turns them into a transform. It also reveals the cards
 * below the ink line (Team, Projects, Partners) with a 3D entrance, once, as
 * they scroll into view. Tilt is for a real mouse only; reduced motion gets
 * neither effect.
 */
export function TiltFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cleanups: Array<() => void> = [];

    // entrances: tilt.css hides the items under html.fx-enter until their group has .is-in
    const groups = ENTER_GROUPS.flatMap((s) => Array.from(document.querySelectorAll(s)));
    if (groups.length) {
      const seen = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            e.target.classList.add("is-in");
            seen.unobserve(e.target);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );
      groups.forEach((g) => seen.observe(g));
      document.documentElement.classList.add("fx-enter");
      cleanups.push(() => {
        seen.disconnect();
        document.documentElement.classList.remove("fx-enter");
      });
    }

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      let active: HTMLElement | null = null;
      let frame = 0;
      let point = { x: 0, y: 0 };

      const paint = () => {
        frame = 0;
        if (!active) return;
        const r = active.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (point.x - r.left) / r.width));
        const py = Math.min(1, Math.max(0, (point.y - r.top) / r.height));
        const s = active.style;
        s.setProperty("--ry", `${((px - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
        s.setProperty("--rx", `${((0.5 - py) * 2 * MAX_TILT).toFixed(2)}deg`);
        s.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
        s.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      };
      const release = (el: HTMLElement | null) => {
        if (!el) return;
        el.classList.remove("is-tilting");
        for (const v of ["--rx", "--ry", "--gx", "--gy"]) el.style.removeProperty(v);
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const el = (e.target as Element).closest<HTMLElement>("[data-tilt]");
        if (el !== active) {
          release(active);
          active = el;
          active?.classList.add("is-tilting");
        }
        point = { x: e.clientX, y: e.clientY };
        if (active && !frame) frame = requestAnimationFrame(paint);
      };
      const onLeave = () => {
        release(active);
        active = null;
      };
      document.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      window.addEventListener("blur", onLeave);
      cleanups.push(() => {
        document.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("blur", onLeave);
        cancelAnimationFrame(frame);
        release(active);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
