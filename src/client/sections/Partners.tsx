import type { CSSProperties } from "react";
import { contact, partners } from "../content";
import "../fx/partners.css";

export function Partners() {
  return (
    <section className="block partners" id="partners" aria-label="Partners">
      <div className="wrap">
        <ul className="logo-wall">
          {partners.map((partner) => (
            <li key={partner.name} data-tilt="">
              <img
                src={partner.logo}
                alt={partner.name}
                width={partner.w}
                height={partner.h}
                loading="lazy"
                decoding="async"
                style={{ "--w": `${partner.w}px`, "--h": `${partner.h}px` } as CSSProperties}
              />
            </li>
          ))}
        </ul>
        <div className="partner-cta" data-tilt="">
          <p className="partner-cta-kicker">work with us</p>
          <p className="partner-cta-title">
            Building a clean, low-carbon <span className="grad">milk corridor?</span> Let’s talk.
          </p>
          <div className="partner-actions">
            <a className="btn" href={contact.partnerMail}>
              partner with us
            </a>
            <a className="btn btn--ghost" href={contact.teamMail}>
              talk to our team
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
