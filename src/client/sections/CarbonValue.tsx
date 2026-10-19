import { brand } from "../content";
import { Scene } from "./Scene";

/** Carbon value: reductions first, credits after. */
export function CarbonValue() {
  return (
    <Scene
      id="offsets"
      kicker="carbon value"
      doodle="offsets"
      doodleLabel="The ZE SITA coin: a cow's head with an ear tag and a dollar medallion, inside two round rims"
      tip={
        <>
          <span className="tip-hint" aria-hidden="true">
            <span className="tip-hint-dot" />
            What's a CowCoin?
          </span>
          <div className="tip-card">
            <div className="tip-head">
              <strong className="tip-title">CowCoin</strong>
              <span className="tip-pill">
                1 = 1 t CO<sub>2</sub>e
              </span>
            </div>
            <p className="tip-lead">
              One CowCoin represents 1 tonne of CO₂e emissions reduction, aggregated from smallholder dairy farms.
            </p>
            <div className="tip-foot">
              <img src={brand.gramCarbonLogo} alt="gramCarbon" width={900} height={139} loading="lazy" decoding="async" />
              <p>
                Powered by gramCarbon, each unit is scientifically quantified and backed by <strong>1,000+</strong>{" "}
                supply-chain and impact data points.
              </p>
            </div>
          </div>
        </>
      }
    >
      <h2 className="display">
        Reductions First.
        <br />
        <span className="grad">Value</span> Follows.
      </h2>
      <p className="body">
        The work is real, measured reductions on the farm. Only verified reductions become carbon projects and credits,
        and that value flows back into the dairy ecosystem: to farmers, cooperatives and the corridor.
      </p>
    </Scene>
  );
}
