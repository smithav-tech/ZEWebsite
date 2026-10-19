import { useState, type FormEvent } from "react";
import { ArrowIcon } from "../components/Icons";
import { contact, partners } from "../content";
import "../fx/partners.css";

const TOPICS = [
  ["partner", "Partnering", "Partnering with ZeroEarth"],
  ["demo", "A gramCarbon demo", "gramCarbon demo request"],
  ["team", "Talking to the team", "Talk to the ZeroEarth team"],
] as const;

/** The partner logos, twice over: the track slides by half its width, so the loop never shows a seam. */
function LogoTrack() {
  const row = (hidden: boolean) => (
    <ul className="marquee-logos" aria-hidden={hidden || undefined}>
      {partners.map((partner) => (
        <li key={partner.name}>
          <img
            src={partner.logo}
            alt={hidden ? "" : partner.name}
            width={partner.w}
            height={partner.h}
            loading="lazy"
            decoding="async"
          />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/**
 * A quick contact form. There is no backend: sending opens the visitor's mail
 * app with the message addressed and filled in.
 */
function ContactForm() {
  const [topic, setTopic] = useState<(typeof TOPICS)[number][0]>("partner");

  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = TOPICS.find(([id]) => id === topic)![2];
    const body = [
      data.get("message"),
      "",
      `${data.get("name")}${data.get("organisation") ? `, ${data.get("organisation")}` : ""}`,
      data.get("email"),
    ].join("\n");
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form className="contact-form" aria-label="Contact form" onSubmit={send}>
      <fieldset className="contact-topics">
        <legend>I’m interested in</legend>
        <div>
          {TOPICS.map(([id, label]) => (
            <label key={id} className="choice">
              <input type="radio" name="topic" value={id} checked={topic === id} onChange={() => setTopic(id)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">
        Name
        <input className="input" type="text" name="name" placeholder="Your name" autoComplete="name" required />
      </label>
      <label className="field">
        Email
        <input className="input" type="email" name="email" placeholder="you@company.com" autoComplete="email" required />
      </label>
      <label className="field field--wide">
        Organisation
        <input
          className="input"
          type="text"
          name="organisation"
          placeholder="Cooperative, company or institution"
          autoComplete="organization"
        />
      </label>
      <label className="field field--wide">
        Message
        <textarea
          className="input"
          name="message"
          rows={4}
          placeholder="Tell us a little about what you’re working on"
          required
        />
      </label>
      <div className="contact-send">
        <button className="btn-cta btn-cta--lg" type="submit">
          Send message
          <span className="btn-cta-icon">
            <ArrowIcon />
          </span>
        </button>
      </div>
    </form>
  );
}

export function Partners() {
  return (
    <section className="block partners" id="partners" aria-label="Partners">
      <p className="kicker kicker--center">our partners</p>
      <LogoTrack />
      <div className="wrap">
        <div className="contact-card" id="contact">
          <div className="contact-intro">
            <p className="kicker">work with us</p>
            <p className="contact-title">
              Building a clean, low-carbon <span className="grad">milk corridor?</span> Let’s talk.
            </p>
            <p className="contact-alt">
              Prefer email? Write to <a href={`mailto:${contact.email}`}>{contact.email}</a> or call{" "}
              <a href={contact.phoneHref}>{contact.phone}</a>.
            </p>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
