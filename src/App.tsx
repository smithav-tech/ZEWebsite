import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader } from "./client/Loader";
import { ClientSite } from "./client/ClientSite";
import { ProjectsPage, TeamPage } from "./client/TeamPage";
import { REVEAL_EVENT } from "./client/reveal";
import { usePath } from "./client/router";
import { restoreScroll, restoringScroll } from "./client/scrollMemory";

const HOME_TITLE = document.title;
const TEAM_TITLE = "Team — ZeroEarth";
const PROJECTS_TITLE = "Projects — ZeroEarth";

// the loader plays once per session, only when the first page is home, and
// never on a reload that goes back to a place further down (it opens at the top)
let introDone = location.pathname.replace(/\/+$/, "") !== "" || restoringScroll;

/**
 * The loader on top of the home page. The page renders behind it from the first
 * frame, so it is laid out and painted when the ripple opens onto it, and
 * scrolls natively; the loader locks scrolling until it hands over.
 */
export default function App() {
  const path = usePath();
  const isTeam = path === "/team";
  const isProjects = path === "/projects";
  const [loaded, setLoaded] = useState(introDone);
  const onDone = useCallback(() => {
    introDone = true;
    setLoaded(true);
  }, []);

  // the page (and the loader over it) is on screen: the static boot paper in
  // index.html, which covered the wait for this script, can go
  useEffect(() => {
    document.getElementById("boot")?.remove();
  }, []);

  useEffect(() => {
    document.title = isTeam ? TEAM_TITLE : isProjects ? PROJECTS_TITLE : HOME_TITLE;
  }, [isTeam, isProjects]);

  // no loader (or it is done): reveal now, put a reload back where it was,
  // and let Back/Forward restore scroll
  useEffect(() => {
    if (loaded) {
      window.dispatchEvent(new Event(REVEAL_EVENT));
      restoreScroll();
      if ("scrollRestoration" in history) history.scrollRestoration = "auto";
    }
  }, [loaded]);

  // the site renders once: the loader finishing must not re-render the whole
  // page in the frame the circle finishes opening
  const site = useMemo(() => <ClientSite />, []);

  if (isTeam) return <TeamPage />;
  if (isProjects) return <ProjectsPage />;
  return (
    <>
      {loaded ? null : <Loader onDone={onDone} />}
      {site}
    </>
  );
}
