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
        supply chain in partnership with leading milk companies.
      </p>
      <Features
        label="Focus areas"
        items={[
          {
            label: "TMR",
            icon: <BowlIcon />,
            tint: "lime",
            href: "https://nddb.coop/services/animalnutrition/crop-residue-management/total-mixed-ration-dry",
            source: "NDDB: Total Mixed Ration",
          },
          {
            label: "Fodder Stress",
            icon: <GrassIcon />,
            tint: "teal",
            href: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2119477",
            source: "PIB, Government of India: the national green fodder deficit and ICAR-IGFRI's fodder solutions",
          },
          {
            label: "Animal Productivity",
            icon: <DropIcon />,
            tint: "purple",
            href: "https://www.nddb.coop/services/animalnutrition/programmes/ration-balancing-programme",
            source: "NDDB: Ration Balancing Programme, more milk from balanced feeding",
          },
        ]}
      />
    </Scene>
  );
}
