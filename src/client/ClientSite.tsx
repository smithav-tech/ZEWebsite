import "./client.css";
import "./fx/type3d.css";
import { Nav } from "./components/Nav";
import { HeadingFx } from "./fx/HeadingFx";
import { TiltFx } from "./fx/Tilt";
import { InkLine } from "./ink/InkLine";
import { MilkBackground } from "./milk/MilkBackground";
import { CarbonValue } from "./sections/CarbonValue";
import { Corridor } from "./sections/Corridor";
import { Energy } from "./sections/Energy";
import { Feed } from "./sections/Feed";
import { Footer } from "./sections/Footer";
import { GramCarbon } from "./sections/GramCarbon";
import { Hero } from "./sections/Hero";
import { Methane } from "./sections/Methane";
import { Partners } from "./sections/Partners";

/**
 * The ZeroEarth site. The milk canvas sits fixed behind everything; `.page` is the positioning box for the ink line's
 * two page-sized SVGs, one behind the content and one in front of it.
 */
export function ClientSite() {
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
        <InkLine />
        <main id="main">
          <Hero />
          <Methane />
          <Feed />
          <Energy />
          <Corridor />
          <GramCarbon />
          <CarbonValue />
          <Partners />
        </main>
        <Footer />
      </div>
    </>
  );
}
