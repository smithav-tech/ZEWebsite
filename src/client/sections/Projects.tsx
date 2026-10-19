import { useEffect, useRef } from "react";
import { projects } from "../content";
import { Portrait, setLive } from "./Team";
import "../team.css";

export function Projects() {
  const section = useRef<HTMLElement>(null);

  // the backgrounds run only while the section is on screen; the threads draw in
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
    <section className="block projects" id="projects" ref={section}>
      <div className="wrap">
        <p className="kicker">projects</p>
        <h2 className="display">
          From Science
          <br />
          to the <span className="grad">Field.</span>
        </h2>
        <p className="body projects-intro">
          Field trials, farmer partnerships and commercial pilots deploying clean dairy across India.
        </p>
        {/* every project at once: each cell flies in (tilt.css), the card inside it tilts */}
        <ul className="leaders" aria-label="Projects">
          {projects.map((item, i) => (
            <li className="leader-cell" key={item.name}>
              <article className="leader project-card" data-tilt="">
                <Portrait photo={item.photo} name={item.name} index={i} cutout={item.cutout ?? false} />
                <h3>{item.name}</h3>
                <p className="role">{item.role}</p>
                <p className="bio">{item.bio}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

