import { FlameIcon, TankIcon } from "../components/Icons";
import { Features, Scene } from "./Scene";

/** Green energy: manure to renewable fuel. */
export function Energy() {
  return (
    <Scene
      id="energy"
      kicker="green energy"
      doodle="energy"
      doodleLabel="A cow, her manure going into a biogas plant that makes CBG, and organic fertiliser feeding the fodder fields"
    >
      <h2 className="display">
        What Remains
        <br />
        Still Has <span className="grad">Value.</span>
      </h2>
      <p className="lede">Turning waste into renewable fuel.</p>
      <p className="body body--long">
        At Zero Earth, we are building a circular dairy economy by transforming cattle manure into high-quality
        biomethane.
      </p>
      <p className="body body--long">
        Through decentralised collection networks and advanced biogas upgrading, we aim to produce automotive-grade{" "}
        <strong>compressed biogas (CBG)</strong> and explore <strong>liquefied biomethane (bio-LNG)</strong> for
        heavy-duty transport, shipping and industrial applications.
      </p>
      <Features
        label="Energy outputs"
        items={[
          { label: "CBG", icon: <FlameIcon />, tint: "lime" },
          { label: "Bio LNG", icon: <TankIcon />, tint: "teal" },
        ]}
      />
    </Scene>
  );
}
