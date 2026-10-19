import { BowlIcon, DropIcon, GrassIcon } from "../components/Icons";
import { Features, Scene } from "./Scene";

/** Feed and fodder: the Total Mixed Ration. */
export function Feed() {
  return (
    <Scene
      id="feed"
      kicker="feed & fodder · tmr"
      doodle="feed"
      doodleLabel="One line through fodder grass, a bowl of mixed feed, and a tractor pulling a trailer of hay bales"
    >
      <h2 className="display">
        From Volume
        <br />
        to <span className="grad">Quality.</span>
      </h2>
      <p className="lede">the next dairy transition.</p>
      <p className="body">
        A standardised <strong>Total Mixed Ration</strong>, made by farmer groups and delivered through the existing
        supply chain in partnership.
      </p>
      <Features
        label="Focus areas"
        items={[
          { label: "TMR", icon: <BowlIcon />, tint: "lime" },
          { label: "Fodder Stress", icon: <GrassIcon />, tint: "teal" },
          { label: "Animal Productivity", icon: <DropIcon />, tint: "purple" },
        ]}
      />
    </Scene>
  );
}
