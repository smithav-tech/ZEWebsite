import { useEffect, useRef } from "react";
import { fieldPhotos } from "../content";
import { setLive } from "./Team";
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
        {/* the headline and the story beside it, so the section opens as one band */}
        <div className="projects-head">
          <h2 className="display">
            From Science
            <br />
            to the <span className="grad">Field.</span>
          </h2>
          <div className="projects-journey">
            <h3>From Pilots to Real-World Impact.</h3>
            <p className="body">
              A glimpse into Zero Earth’s journey from field trials to commercial adoption. From our Gates
              Foundation-supported pilot with 100 women dairy farmers in Nainarpalayam to trials and commercial
              integration with leading milk companies.
            </p>
          </div>
        </div>
        {/* photos from the field, in the project-card frame, with no captions */}
        <ul className="leaders field-photos" aria-label="Photos from the field">
          {fieldPhotos.map((item) => (
            <li className="leader-cell project-card" key={item.photo}>
              <div className="portrait portrait--photo">
                <img src={item.photo} alt={item.alt} width={960} height={1200} loading="lazy" decoding="async" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

