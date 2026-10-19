import { Ch4ow } from "../components/Brand";
import { Scene } from "./Scene";

/** CH4OW: the methane-reducing feed. */
export function Methane() {
  return (
    <Scene
      id="methane"
      kicker={
        // one flex item, so the kicker's gap does not open up round the subscript
        <span>
          methane · <Ch4ow />
        </span>
      }
      doodle="methane"
      doodleLabel="A one-line drawing of a contented cow, her methane curling away in loops and back down: less methane"
    >
      <h2 className="display">
        <span className="grad">23%</span> Less Methane.
      </h2>
      <p className="fine">
        <strong>
          <Ch4ow tm />
        </strong>{" "}
        — methane-reducing feed technology.
      </p>
      <p className="fine muted">
        Researched with ICAR scientists. 100% natural supplement and BIS-listed ingredients that replaces 3–5% of
        filler in cattle feed, with no change on the farm or feeding cost.
      </p>
    </Scene>
  );
}
