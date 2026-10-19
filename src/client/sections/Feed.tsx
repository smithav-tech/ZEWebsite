import { LearnMore, Scene } from "./Scene";

/** Feed and fodder: the Total Mixed Ration. */
export function Feed() {
  return (
    <Scene
      id="feed"
      kicker="feed & fodder · tmr"
      doodle="feed"
      doodleLabel="Fodder grass, a tractor carrying fodder, and a feed bowl"
    >
      <h2 className="display">
        from volume
        <br />
        to <span className="grad">quality.</span>
      </h2>
      <p className="lede">the next dairy transition.</p>
      <p className="body">
        A standardised <strong>Total Mixed Ration</strong>, made by farmer producer organisations and delivered through
        the cooperative network.
      </p>
      <LearnMore
        links={[
          ["TMR", "https://nddb.coop/services/animalnutrition/crop-residue-management/total-mixed-ration-dry"],
          ["fodder stress", "https://en.wikipedia.org/wiki/Fodder"],
          ["animal productivity", "https://en.wikipedia.org/wiki/Dairy_cattle"],
        ]}
      />
    </Scene>
  );
}
