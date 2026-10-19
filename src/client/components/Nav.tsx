import { useEffect, useState, type ReactNode } from "react";
import { pageLink, sectionLink, usePath } from "../router";
import { Ch4ow, GramCarbonLogo, ZeroEarthLogo } from "./Brand";
import { ArrowIcon } from "./Icons";

const LINKS: [href: string, label: ReactNode][] = [
  ["#methane", <Ch4ow />],
  ["#feed", "Feed"],
  ["#energy", "Energy"],
  ["#corridor", "Corridor"],
  ["#gramcarbon", <GramCarbonLogo />],
];

/** Fixed top bar. Below 1060px the links fold into a menu button. */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePath();
  const close = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? "nav--scrolled" : ""} ${open ? "nav--open" : ""}`}>
      <div className="nav-inner">
        <ZeroEarthLogo height={28} />
        <nav aria-label="Main">
          <ul className="nav-links" id="nav-links">
            {LINKS.map(([href, label]) => (
              <li key={href}>
                <a {...sectionLink(href, path, close)}>{label}</a>
              </li>
            ))}
            <li className="nav-divider" aria-hidden="true" />
            <li>
              <a {...pageLink("/projects", close)} aria-current={path === "/projects" ? "page" : undefined}>
                Projects
              </a>
            </li>
            <li>
              <a {...pageLink("/team", close)} aria-current={path === "/team" ? "page" : undefined}>
                Team
              </a>
            </li>
          </ul>
        </nav>
        <a className="btn-cta nav-cta" {...sectionLink("#contact", path, close)}>
          Partner with us
          <span className="btn-cta-icon">
            <ArrowIcon />
          </span>
        </a>
        <button className="nav-toggle" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen((o) => !o)}>
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="nav-toggle-bars" />
        </button>
      </div>
    </header>
  );
}
