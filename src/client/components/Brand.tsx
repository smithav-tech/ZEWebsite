import { brand } from "../content";
import { pageLink } from "../router";

/** The zeroearth wordmark, linking home. */
export function ZeroEarthLogo({ height = 26 }: { height?: number }) {
  return (
    <a {...pageLink("/")} className="logo" aria-label="ZeroEarth home">
      <img src={brand.logo} alt="zeroearth" height={height} style={{ height, width: "auto" }} />
    </a>
  );
}

/** The gramCarbon wordmark, sized to the text around it (1em by default). */
export function GramCarbonLogo({ className = "" }: { className?: string }) {
  return <img src={brand.gramCarbonLogo} alt="gramCarbon" className={`gc-logo ${className}`} />;
}

/** CH₄OW with a real subscript. */
export function Ch4ow({ tm = false }: { tm?: boolean }) {
  return (
    <>
      CH<sub>4</sub>OW{tm ? "™" : null}
    </>
  );
}
