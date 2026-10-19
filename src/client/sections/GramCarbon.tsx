import { GramCarbonLogo } from "../components/Brand";
import { ArrowIcon } from "../components/Icons";
import { contact } from "../content";
import { Scene } from "./Scene";

/** gramCarbon: trace, measure, verify. */
export function GramCarbon() {
  return (
    <Scene
      id="gramcarbon"
      kicker={<GramCarbonLogo className="gc-logo--kicker" />}
      doodle="gramcarbon"
      doodleLabel="The gramCarbon wordmark written in one flowing line, three petals in place of the r"
    >
      <h2 className="display">
        Trace.
        <br />
        Measure.
        <br />
        <span className="grad">Verify.</span>
      </h2>
      <p className="body">
        <GramCarbonLogo className="gc-logo--inline" /> records every handover on WhatsApp smart cards, gives each batch
        and farmer a CCC-ID, and turns supply-chain data into auditable, farmer-level emission reductions.
      </p>
      <p className="scene-action">
        <a className="btn-cta btn-cta--lg" href={contact.demoMail}>
          Ask a Demo
          <span className="btn-cta-icon">
            <ArrowIcon />
          </span>
        </a>
      </p>
    </Scene>
  );
}
