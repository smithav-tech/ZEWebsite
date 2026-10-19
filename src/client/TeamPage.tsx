import { useEffect, type ReactNode } from "react";
import "./client.css";
import "./fx/type3d.css";
import { HomeIcon } from "./components/Icons";
import { Nav } from "./components/Nav";
import { HeadingFx } from "./fx/HeadingFx";
import { TiltFx } from "./fx/Tilt";
import { MilkBackground } from "./milk/MilkBackground";
import { pageLink } from "./router";
import { restoreScroll } from "./scrollMemory";
import { Footer } from "./sections/Footer";
import { Projects } from "./sections/Projects";
import { Team } from "./sections/Team";

/** One section on its own page: its images only load when you come here. */
function SubPage({ children }: { children: ReactNode }) {
  // a reload stays where it was; arriving from another page starts at the top
  useEffect(() => {
    if (!restoreScroll()) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <>
      <MilkBackground />
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <TiltFx />
      <HeadingFx />
      <div className="page">
        <main id="main" className="team-page">
          {children}
          <div className="wrap team-back">
            <a className="btn-cta btn-cta--lg btn-cta--back" {...pageLink("/")}>
              <span className="btn-cta-icon" aria-hidden="true">
                <HomeIcon />
              </span>
              Back to Home
            </a>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export function TeamPage() {
  return (
    <SubPage>
      <Team />
    </SubPage>
  );
}

export function ProjectsPage() {
  return (
    <SubPage>
      <Projects />
    </SubPage>
  );
}
