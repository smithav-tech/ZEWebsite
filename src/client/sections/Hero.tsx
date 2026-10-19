import { Doodle } from "../ink/Doodle";

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-inner">
        
        <h1 className="hero-title">
          Decarbonising
          <br />
          <span className="grad">Dairy.</span>
        </h1>
        <p className="scroll-cue" aria-hidden="true">
          <i />
          scroll to explore
        </p>
      </div>
      <div className="hero-art">
        <Doodle
          scene="cow"
          interactive
          label="A single-line doodle of a cow, drawn as you move the cursor or scroll"
        />
      </div>
    </section>
  );
}
