import { Scene } from "./Scene";

/** Carbon value: reductions first, credits after. */
export function CarbonValue() {
  return (
    <Scene
      id="offsets"
      kicker="carbon value"
      doodle="offsets"
      glow
      doodleLabel="A stack of coins with a seedling growing from it, an arrow pointing down, and a credit certificate with a seal"
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
