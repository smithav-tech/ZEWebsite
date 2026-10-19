import { Ch4ow } from "../components/Brand";
import { Scene } from "./Scene";

/** The corridor: every piece as one system. */
export function Corridor() {
  return (
    <Scene
      id="corridor"
      kicker="the corridor"
      doodle="corridor"
      doodleLabel="One route linking a cow, a sack of CH4OW feed, a tractor, a milk can, a biogas plant with its flame, and a phone showing data"
    >
      <h2 className="display">
        one dairy system.
        <br />
        one <span className="grad">climate</span> transition.
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
