import { GramCarbonLogo } from "../components/Brand";
import { Scene } from "./Scene";

/** gramCarbon: trace, measure, verify. */
export function GramCarbon() {
  return (
    <Scene
      id="gramcarbon"
      kicker={<GramCarbonLogo className="gc-logo--kicker" />}
      doodle="gramcarbon"
      doodleLabel="A map pin, a bar chart and a shield with a tick: trace, measure, verify"
    >
      <h2 className="display">
        trace.
        <br />
        measure.
        <br />
        <span className="grad">verify.</span>
      </h2>
      <p className="body">
        <GramCarbonLogo className="gc-logo--inline" /> records every handover on WhatsApp smart cards, gives each batch
        and farmer a CCC-ID, and turns supply-chain data into auditable, farmer-level emission reductions.
      </p>
      <p className="fine">
        <a className="btn" href="https://gramcarbon.zeroearth.company/dashboard" target="_blank" rel="noreferrer">
          explore gramcarbon dashboard ↗
        </a>
      </p>
    </Scene>
  );
}
