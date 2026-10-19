import { Ch4ow, GramCarbonLogo, ZeroEarthLogo } from "../components/Brand";
import { contact } from "../content";
import { pageLink, sectionLink, usePath } from "../router";

export function Footer() {
  const path = usePath();
  return (
    <footer className="footer">
      <div className="wrap footer-top">
        <div>
          <ZeroEarthLogo height={34} />
          <p className="footer-tag">
            climate action.
            <br />
            farmer prosperity.
            <br />
            quality milk.
          </p>
        </div>
        <ul className="footer-links">
          <li>
            <a {...sectionLink("#methane", path)}>
              <Ch4ow />
            </a>
          </li>
          <li>
            <a {...sectionLink("#feed", path)}>feed &amp; tmr</a>
          </li>
          <li>
            <a {...sectionLink("#energy", path)}>green energy</a>
          </li>
        </ul>
        <ul className="footer-links">
          <li>
            <a {...sectionLink("#corridor", path)}>corridor</a>
          </li>
          <li>
            <a {...sectionLink("#gramcarbon", path)} aria-label="gramCarbon">
              <GramCarbonLogo />
            </a>
          </li>
          <li>
            <a {...pageLink("/projects")}>projects</a>
          </li>
          <li>
            <a {...pageLink("/team")}>team</a>
          </li>
        </ul>
        <div className="footer-hq">
          <p className="mono">headquarters</p>
          <p>Kerala, India</p>
          <p className="mono">contact</p>
          <p>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
        </div>
      </div>
      <div className="wrap footer-legal">
        <p>© {new Date().getFullYear()} ZeroEarth. All rights reserved.</p>
        <p className="mono">CIN U72100KL2023PTC080575 · made in india</p>
      </div>
    </footer>
  );
}
