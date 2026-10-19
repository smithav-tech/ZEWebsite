import { Doodle } from "../ink/Doodle";
import { sectionLink, usePath } from "../router";

export function Hero() {
  const path = usePath();
  return (
    <section className="hero" id="top">
      <div className="hero-inner">
        <h1 className="hero-title">
          Decarbonising
          <br />
          <span className="grad">Dairy.</span>
        </h1>
        <div className="hero-copy">
          <p className="hero-tagline">Better milk. Better livelihoods. A better planet.</p>
          <p>
            India is the world’s largest milk producer. At Zero Earth, we are reimagining its dairy value chain for a
            low-carbon, climate-resilient future.
          </p>
          <p>
            Through science-led methane reduction, resilient feed and fodder systems, and circular resource management,
            we are transforming dairy into a more sustainable and economically resilient industry and creating pathways
            to clean, renewable energy.
          </p>
        </div>
        <p>
          <a className="scroll-cue" {...sectionLink("#methane", path)}>
            <span className="scroll-mouse" aria-hidden="true" />
            Scroll to explore
          </a>
        </p>
      </div>
      <div className="hero-art">
        <Doodle
          scene="cow"
          interactive
          label="A single-line doodle of a cow nursing her calf, drawn as you move the cursor or scroll"
        />
      </div>
    </section>
  );
}
