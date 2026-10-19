import { useEffect, useRef, useState, type CSSProperties } from "react";
import { advisors, team } from "../content";
import "../team.css";

/*
 * Each portrait sits on living milk: soft lime, cyan and milk-white light
 * drifting like cream folding into milk, a faint hand-drawn thread arcing low
 * behind the shoulders (team cards only). The loops move
 * transform and opacity only (the thread's one-off draw-in and its hover
 * close are the only paints), run only while the section is on screen, and
 * hold still under reduced motion.
 *
 * Every layer's delay is read off one shared clock that stops while the
 * section is paused, instead of off its own mount time, so the cards stay in
 * step with each other.
 */
const clock = { pausedAt: 0 as number | null, pausedTotal: 0 };
const now = () => performance.now();
/** seconds of animation time so far (time the section was paused does not count) */
const animationTime = () => {
  const t = now();
  return (t - clock.pausedTotal - (clock.pausedAt === null ? 0 : t - clock.pausedAt)) / 1000;
};
export function setLive(live: boolean) {
  if (live && clock.pausedAt !== null) {
    clock.pausedTotal += now() - clock.pausedAt;
    clock.pausedAt = null;
  } else if (!live && clock.pausedAt === null) {
    clock.pausedAt = now();
  }
}

/** One mood per person, so the row never reads as one card repeated. */
interface Mood {
  /** seconds into the shared loops this person starts */
  offset: number;
  /** which way the light swirls */
  turn: "normal" | "reverse";
  /** blob anchors, as card percentages */
  lime: [number, number];
  cyan: [number, number];
  milk: [number, number];
}

const MOODS: Mood[] = [
  { offset: 0, turn: "normal", lime: [-18, 44], cyan: [44, -14], milk: [-6, 18] },
  { offset: 11.3, turn: "reverse", lime: [46, 40], cyan: [-24, -6], milk: [4, 30] },
  { offset: 23.9, turn: "normal", lime: [-10, -12], cyan: [40, 38], milk: [-10, 10] },
  { offset: 37.1, turn: "reverse", lime: [36, -16], cyan: [-20, 40], milk: [0, 24] },
  { offset: 52.6, turn: "normal", lime: [-22, 10], cyan: [46, 20], milk: [-4, 36] },
];

/**
 * Hand-drawn thread for the 4:5 cards (viewBox 0 0 100 125): a low, open arc
 * behind the shoulders and the neck, well below the hairline, some with the
 * line's loop-de-loop out at one side. The photo sits in front, so only the
 * ends show either side of the person.
 */
const THREADS = [
  "M 2 96 C 10 78, 26 68, 42 66 C 58 64, 74 66, 85 74 C 93 79, 95 88, 89 89 C 83 90, 82 82, 88 80 C 94 78, 99 86, 99 96",
  "M 98 94 C 90 77, 72 68, 54 67 C 36 66, 19 71, 11 80 C 6 85, 7 93, 13 92 C 19 91, 18 83, 12 83 C 6 83, 2 91, 3 100",
  "M 0 84 C 14 76, 28 78, 40 72 C 52 66, 62 66, 74 71 C 86 76, 92 74, 100 68",
  "M 4 102 C 6 88, 18 76, 34 72 C 48 69, 58 70, 66 68 C 74 66, 77 60, 72 59 C 67 58, 66 66, 72 70 C 82 76, 93 80, 98 96",
  "M 100 102 C 94 86, 80 75, 62 71 C 44 67, 26 71, 14 81 C 8 86, 4 94, 6 106",
];

/** native pixel sizes of the cutouts, so the cards reserve their shape and never blow one up */
const SIZES: Record<string, [number, number]> = {
  "ani-varghese": [720, 962],
  "smitha-v": [720, 772],
  "krishna-kumar": [720, 830],
  "ravi-k-a": [720, 815],
  "m-hazeem": [720, 656],
  "gert-van-duinkerken": [400, 400],
  "trevor-tomkins": [400, 400],
  "veerasamy-sejian": [400, 400],
  "kerala-kvasu-milma": [456, 452],
  "rajasthan-corridor": [239, 334],
  "milky-mist-tamil-nadu": [1400, 883],
  "nainarpalayam-tamil-nadu": [1400, 933],
};
const sizeOf = (photo: string) => SIZES[photo.replace(/^.*\/|\.\w+$/g, "")];

const pct = ([x, y]: [number, number]) => ({ x: `${x}%`, y: `${y}%` });

/** A background-removed portrait on a softly moving milk-and-mint card. */
export function Portrait({
  photo,
  name,
  index,
  round = false,
  cutout = true,
}: {
  photo: string;
  name: string;
  index: number;
  round?: boolean;
  cutout?: boolean;
}) {
  // read once per mount: a later render must never shift a running animation
  const [start] = useState(animationTime);
  const img = useRef<HTMLImageElement>(null);
  const mood = MOODS[index % MOODS.length];
  const lime = pct(mood.lime);
  const cyan = pct(mood.cyan);
  const milk = pct(mood.milk);
  const [w, h] = sizeOf(photo) ?? [];
  const style = {
    "--pt-t": (start + mood.offset).toFixed(3),
    "--pt-dir": mood.turn,
    "--pt-lime-x": lime.x,
    "--pt-lime-y": lime.y,
    "--pt-cyan-x": cyan.x,
    "--pt-cyan-y": cyan.y,
    "--pt-milk-x": milk.x,
    "--pt-milk-y": milk.y,
  } as CSSProperties;

  // a few cutouts were cropped square at the top or the side: soften those
  // edges. The photo is drawn "cover", pinned to the top of its box, so the
  // fade is placed on the drawn picture (which may overflow the box), not on the box.
  useEffect(() => {
    const el = img.current;
    if (!el || round || !cutout) return;
    const fit = () => {
      const [bw, bh] = [el.clientWidth, el.clientHeight];
      const ratio = el.naturalWidth / el.naturalHeight;
      if (!bw || !bh || !ratio) return;
      const [w, h] = bw / bh < ratio ? [bh * ratio, bh] : [bw, bw / ratio];
      el.style.setProperty("--pt-mask-size", `${w.toFixed(1)}px ${h.toFixed(1)}px`);
      el.style.setProperty("--pt-mask-pos", `${((bw - w) / 2).toFixed(1)}px 0px`);
    };
    const sizes = new ResizeObserver(fit);
    sizes.observe(el);
    el.addEventListener("load", fit);
    fit();
    return () => {
      sizes.disconnect();
      el.removeEventListener("load", fit);
    };
  }, [round, cutout]);

  return (
    <div className={`portrait ${round ? "portrait--round" : ""} ${cutout ? "portrait--cutout" : "portrait--photo"}`} style={style}>
      {cutout ? (
        <div className="pt-bg" aria-hidden="true">
          <span className="pt-swirl">
            <span className="pt-blob pt-blob--lime" />
            <span className="pt-blob pt-blob--cyan" />
          </span>
          <span className="pt-blob pt-blob--milk" />
          <span className="pt-ripple" />
          <span className="pt-ripple pt-ripple--echo" />
          {round ? null : (
            <svg className="pt-thread" viewBox="0 0 100 125" preserveAspectRatio="none">
              <path d={THREADS[index % THREADS.length]} pathLength={100} />
            </svg>
          )}
        </div>
      ) : null}
      <img
        ref={img}
        src={photo}
        alt={`Image of ${name}`}
        width={w}
        height={h}
        loading="lazy"
        decoding="async"
        style={w && cutout ? ({ "--w": w, "--h": h } as CSSProperties) : undefined}
      />
    </div>
  );
}

export function Team() {
  const section = useRef<HTMLElement>(null);

  // the backgrounds run only while the section is (nearly) on screen; the
  // threads draw in the first time it arrives
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const live = entry.isIntersecting;
        setLive(live);
        el.toggleAttribute("data-live", live);
        if (live) el.setAttribute("data-drawn", "");
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      setLive(false);
      el.removeAttribute("data-live");
    };
  }, []);


  return (
    <>
    <section className="block team" id="team" ref={section}>
      <div className="wrap">
        <p className="kicker">team</p>
        <h2 className="display">
          The People
          <br />
          Behind the <span className="grad">Line.</span>
        </h2>
        <p className="body team-intro">
          A women-led team with 25+ years of cumulative experience in the climate sector.
        </p>
        {/* everyone at once: each cell flies in (tilt.css), the card inside it tilts */}
        <ul className="leaders" aria-label="Leadership team">
          {team.map((person, i) => (
            <li className="leader-cell" key={person.name}>
              <article className="leader" data-tilt="">
                <Portrait photo={person.photo} name={person.name} index={i} cutout={false} />
                <h3>{person.name}</h3>
                <p className="role">{person.role}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
    <section className="advisors-band" aria-labelledby="advisors-title">
      <div className="wrap">
        <p className="kicker">advisory board</p>
        <h2 id="advisors-title">Our Advisors</h2>
        <div className="advisors">
          <ul>
            {advisors.map((advisor) => {
              const [w, h] = sizeOf(advisor.photo) ?? [];
              return (
                <li key={advisor.name} data-tilt="">
                  <div className="advisor-photo">
                    <img
                      src={advisor.photo}
                      alt={`Image of ${advisor.name}`}
                      width={w}
                      height={h}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3>{advisor.name}</h3>
                  <p>{advisor.affiliation}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
    </>
  );
}
