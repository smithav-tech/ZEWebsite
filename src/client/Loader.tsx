import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { REVEAL_EVENT } from "./reveal";
import "./loader.css";

gsap.registerPlugin(CustomEase, SplitText);
CustomEase.create("milk", "M0,0 C0.16,1 0.3,1 1,1");

// keys that scroll the page while the loader is up
const SCROLL_KEYS = new Set([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]);
const PETAL = "M0 0 C 46 40, 46 100, 0 118 C -46 100, -46 40, 0 0 Z";

/**
 * The zeroearth.company loader. Petals bloom while the count runs to 100, the
 * mark spins away, one milk drop falls, and the page opens from its ripple.
 * The site behind it goes live ("ze:reveal") as the ripple starts to open.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reveal = () => window.dispatchEvent(new Event(REVEAL_EVENT));

    // reduced motion: as on the live site, no loader at all
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal();
      onDone();
      return;
    }

    /* ── scroll lock: events, not overflow, so a classic scrollbar never jumps ── */
    const block = (e: Event) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => SCROLL_KEYS.has(e.key) && e.preventDefault();
    const hold = () => window.scrollY && window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", blockKeys);
    window.addEventListener("scroll", hold, { passive: true });
    const removeLock = () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys);
      window.removeEventListener("scroll", hold);
    };
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      removeLock();
      el.style.pointerEvents = "none";
      // main.tsx holds restoration off so a load opens at the top
      if ("scrollRestoration" in history) history.scrollRestoration = "auto";
      // a deep link (/#partners) lands on its section once the page is live
      const id = decodeURIComponent(location.hash.slice(1));
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

    let tl: gsap.core.Timeline | undefined;
    let split: SplitText | undefined;
    let cancelled = false;
    const start = () => {
      if (cancelled || tl) return;
      const q = gsap.utils.selector(el);
      const countEl = q(".loader__count span")[0] as HTMLElement;
      split = SplitText.create(q(".loader__caption"), { type: "chars" });
      const count = { v: 0 };
      gsap.set([q(".loader__mark"), q(".loader__caption"), countEl], { visibility: "visible" });
      tl = gsap
        .timeline({ defaults: { ease: "milk" } })
        .from(q(".petal"), { scale: 0, opacity: 0, svgOrigin: "0 -30", duration: 1, ease: "back.out(1.6)", stagger: 0.16 }, 0.1)
        .from(split.chars, { opacity: 0, y: 8, duration: 0.5, stagger: 0.025 }, 0.2)
        .to(count, { v: 100, duration: 1.9, ease: "power2.inOut", onUpdate: () => void (countEl.textContent = String(Math.round(count.v)).padStart(2, "0")) }, 0)
        .to(q(".loader__mark"), { rotate: 120, scale: 0.15, opacity: 0, duration: 0.8, ease: "power3.in" }, 2.05)
        .to([q(".loader__caption"), q(".loader__count")], { y: -30, opacity: 0, duration: 0.5, ease: "power2.in" }, 2.05)
        // a single milk drop falls, hits the sheet, and the page opens from its ripple
        .fromTo(q(".loader__drop"), { y: -window.innerHeight * 0.6, opacity: 1, scaleY: 1.5, scaleX: 0.8 }, { y: 0, scaleY: 1.25, scaleX: 0.9, duration: 0.55, ease: "power2.in" }, 2.2)
        .to(q(".loader__drop"), { scaleY: 0.2, scaleX: 2.2, opacity: 0, duration: 0.18, ease: "power2.out" })
        .fromTo(q(".loader__ripple"), { scale: 0.1, opacity: 0.9 }, { scale: 9, opacity: 0, duration: 1.4, ease: "power2.out", stagger: 0.14 }, 2.75)
        .call(reveal, [], 2.8)
        .call(unlock, [], 2.8)
        .to(el, { "--hole": Math.hypot(window.innerWidth, window.innerHeight) * 0.6 + "px", duration: 1.2, ease: "power3.inOut" }, 2.8)
        .call(onDone);
    };

    (document.fonts?.ready ?? Promise.resolve()).then(start, start);
    // the live site never lets the loader block for more than 6 s
    const failsafe = setTimeout(() => {
      if (tl) return;
      reveal();
      unlock();
      onDone();
    }, 6000);

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      tl?.kill();
      split?.revert();
      removeLock();
    };
  }, [onDone]);

  return (
    <div ref={root} className="loader" aria-hidden="true">
      <svg className="loader__curtain" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 0 H100 V100 Q50 100 0 100 Z" />
      </svg>
      <div className="loader__mark">
        <svg viewBox="-120 -120 240 240">
          <g transform="translate(0,-30)">
            <path className="petal petal--teal" d={PETAL} />
            <path className="petal petal--purple" d={PETAL} transform="rotate(120)" />
            <path className="petal petal--orange" d={PETAL} transform="rotate(-120)" />
          </g>
        </svg>
      </div>
      <span className="loader__drop" />
      <span className="loader__ripple" />
      <span className="loader__ripple" />
      <span className="loader__ripple" />
      <p className="loader__caption">Low-carbon milk programme</p>
      <p className="loader__count">
        <span>00</span>
      </p>
    </div>
  );
}
