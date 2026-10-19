import { Ch4ow } from "../components/Brand";
import { Scene } from "./Scene";

/** The corridor: every piece as one system. */
export function Corridor() {
  return (
    <Scene
      id="corridor"
      kicker="the corridor"
      doodle="corridor"
      doodleLabel="One winding road linking a cow, a bundle of feed, a tractor, a milk can, a biogas dome and a phone showing a rising graph"
    >
      <h2 className="display">
        One Dairy System.
        <br />
        One <span className="grad">Climate</span> Transition.
      </h2>
      <p className="lede">clean low-carbon milk corridor.</p>
      <p className="body">
        <Ch4ow />, TMR, CBG, traceability, farmer interventions and the technologies still to come aren’t separate
        projects. Together they form the ZeroEarth corridor, linking feed plants, FPOs, cooperatives, farmers and milk
        processors.
      </p>
    </Scene>
  );
}
