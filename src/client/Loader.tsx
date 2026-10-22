import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { brand } from "./content";
import { REVEAL_EVENT, whenInkReady } from "./reveal";
import "./loader.css";

gsap.registerPlugin(CustomEase, SplitText);
CustomEase.create("milk", "M0,0 C0.16,1 0.3,1 1,1");

// keys that scroll the page while the loader is up
const SCROLL_KEYS = new Set([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]);
const PETAL = "M0 0 C 46 40, 46 100, 0 118 C -46 100, -46 40, 0 0 Z";
// the progress ring round the mark
const RING_R = 136;
const RING_C = 2 * Math.PI * RING_R;

/**
 * The zeroearth.company loader. Petals bloom and turn inside a brand-gradient
 * ring that fills as the count runs to 100, over the wordmark and tagline;
 * then the mark spins away, one milk drop falls, and the page opens from its ripple.
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
      const ring = el.querySelector<SVGCircleElement>(".loader__ring-fill")!;
      split = SplitText.create(q(".loader__tagline"), { type: "words,chars" });
      const count = { v: 0 };
      // the page opens through a growing hole in the middle: the screen, less a
      // circle (even-odd), a hard-edged shape the browser can clip on the GPU.
      // The screen is measured once, here: read in every frame of the tween it
      // would force a layout each time
      const [w, h] = [window.innerWidth, window.innerHeight];
      const hole = { r: 0 };
      const openHole = () => {
        const r = hole.r;
        const [cx, cy] = [w / 2, h / 2];
        el.style.clipPath =
          `path(evenodd, "M0 0H${w}V${h}H0Z M${(cx - r).toFixed(1)} ${cy} ` +
          `a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0 a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0Z")`;
      };
      // the number is written only when it changes, not on every frame
      let shown = -1;
      const progress = () => {
        const n = Math.round(count.v);
        if (n !== shown) {
          shown = n;
          countEl.textContent = String(n).padStart(2, "0");
        }
        ring.style.strokeDashoffset = String(RING_C * (1 - count.v / 100));
      };
      gsap.set(q(".loader__mark, .loader__brand, .loader__caption, .loader__count"), { visibility: "visible" });
      tl = gsap
        .timeline({ defaults: { ease: "milk" } })
        .from(q(".loader__ring"), { scale: 0.7, opacity: 0, svgOrigin: "0 0", duration: 0.9 }, 0)
        .from(q(".petal"), { scale: 0, opacity: 0, svgOrigin: "0 0", duration: 1, ease: "back.out(1.6)", stagger: 0.16 }, 0.1)
        // the bloom turns a third while it loads
        .to(q(".loader__petals"), { rotate: 120, svgOrigin: "0 0", duration: 2, ease: "power2.inOut" }, 0.1)
        .from(q(".loader__logo"), { opacity: 0, y: 14, duration: 0.8 }, 0.3)
        .from(split.chars, { opacity: 0, y: 8, duration: 0.5, stagger: 0.018 }, 0.45)
        .from(q(".loader__caption, .loader__count"), { opacity: 0, duration: 0.6 }, 0.3)
        .to(count, { v: 100, duration: 1.9, ease: "power2.inOut", onUpdate: progress }, 0)
        // the exits give their start values, so nothing reads computed style mid-animation
        .fromTo(q(".loader__ring"), { opacity: 1, scale: 1 }, { opacity: 0, scale: 1.15, svgOrigin: "0 0", duration: 0.5, ease: "power2.in", immediateRender: false }, 2.05)
        .fromTo(q(".loader__mark"), { rotate: 0, scale: 1, opacity: 1 }, { rotate: 120, scale: 0.15, opacity: 0, duration: 0.8, ease: "power3.in", immediateRender: false }, 2.05)
        .fromTo(q(".loader__brand"), { y: 0, opacity: 1 }, { y: -20, opacity: 0, duration: 0.5, ease: "power2.in", immediateRender: false }, 2.05)
        .fromTo(q(".loader__caption, .loader__count"), { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "power2.in", immediateRender: false }, 2.05)
        // a single milk drop falls, hits the sheet, and the page opens from its ripple
        .fromTo(q(".loader__drop"), { y: -h * 0.6, opacity: 1, scaleY: 1.5, scaleX: 0.8 }, { y: 0, scaleY: 1.25, scaleX: 0.9, duration: 0.55, ease: "power2.in", immediateRender: false }, 2.2)
        .to(q(".loader__drop"), { scaleY: 0.2, scaleX: 2.2, opacity: 0, duration: 0.18, ease: "power2.out" })
        // the rings are drawn at their final size (loader.css): 1/90 grows to 1, as 120px grew 9x
        .fromTo(q(".loader__ripple"), { scale: 0.1 / 9, opacity: 0.9 }, { scale: 1, opacity: 0, duration: 1.4, ease: "power2.out", stagger: 0.14, immediateRender: false }, 2.75)
        .call(reveal, [], 2.8)
        .call(unlock, [], 2.8)
        .to(hole, { r: Math.hypot(w, h) * 0.6, duration: 1.2, ease: "power3.inOut", onUpdate: openHole }, 2.8)
        .call(onDone);
      // run the playhead to the end and back, callbacks off, before the first
      // frame: every tween reads its start values here, while nothing shows,
      // rather than as it starts, where each read forces a style recalc and a
      // layout in the middle of the animation
      tl.progress(1, true).progress(0, true);
    };

    // start once the webfonts are in and the ink line has laid out, so its heavy
    // layout never lands in the timeline's first frames
    let cancelInk: (() => void) | undefined;
    const startWhenInk = () => {
      if (!cancelled) cancelInk = whenInkReady(start);
    };
    (document.fonts?.ready ?? Promise.resolve()).then(startWhenInk, startWhenInk);
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
      cancelInk?.();
      tl?.kill();
      split?.revert();
      removeLock();
    };
  }, [onDone]);

  return (
    <div ref={root} className="loader" aria-hidden="true">
      <div className="loader__center">
        <div className="loader__mark">
          <svg viewBox="-150 -150 300 300">
            <defs>
              <linearGradient id="loader-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#a6cf72" />
                <stop offset="0.5" stopColor="#4cbfbe" />
                <stop offset="1" stopColor="#3dbbc9" />
              </linearGradient>
            </defs>
            <g className="loader__ring">
              <circle className="loader__ring-track" r={RING_R} />
              <circle
                className="loader__ring-fill"
                r={RING_R}
                transform="rotate(-90)"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C}
              />
            </g>
            <g className="loader__petals">
              <g transform="scale(0.8)">
                <path className="petal petal--teal" d={PETAL} />
                <path className="petal petal--purple" d={PETAL} transform="rotate(120)" />
                <path className="petal petal--orange" d={PETAL} transform="rotate(-120)" />
              </g>
            </g>
          </svg>
        </div>
        <div className="loader__brand">
          <img className="loader__logo" src={brand.logo} alt="" />
          <p className="loader__tagline">Better milk. Better livelihoods. A better planet.</p>
        </div>
      </div>
      <span className="loader__drop" />
      <span className="loader__ripple" />
      <span className="loader__ripple" />
      <span className="loader__ripple" />
      <p className="loader__caption">Low-carbon milk programme</p>
      <p className="loader__count">
        <span>00</span>%
      </p>
    </div>
  );
}
