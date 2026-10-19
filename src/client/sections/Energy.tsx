import { LearnMore, Scene } from "./Scene";

/** Green energy: manure to compressed biogas. */
export function Energy() {
  return (
    <Scene
      id="energy"
      kicker="green energy"
      doodle="energy"
      doodleLabel="A cow, her manure going into a biogas plant that makes CBG, and organic fertiliser feeding the fodder fields"
    >
      <h2 className="display">
        what remains
        <br />
        still has <span className="grad">value.</span>
      </h2>
      <p className="body">
        Manure becomes <strong>compressed biogas (CBG)</strong> and organic fertiliser. Managed well, it cuts emissions,
        returns nutrients to the fodder fields and adds another income stream to the dairy system.
      </p>
      <LearnMore
        links={[
          ["CBG", "https://en.wikipedia.org/wiki/Biogas"],
          ["manure management", "https://en.wikipedia.org/wiki/Manure_management"],
          ["nutrient recovery", "https://en.wikipedia.org/wiki/Resource_recovery"],
          ["circularity", "https://en.wikipedia.org/wiki/Circular_economy"],
        ]}
      />
    </Scene>
  );
}
