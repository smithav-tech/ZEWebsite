/**
 * The lists the sections render, and every image path. Prose that sits inside
 * a single section lives in that section's component.
 */

const MEDIA = "/media/client";

export const brand = {
  logo: `${MEDIA}/brand/zeroearth-logo.png`,
  gramCarbonLogo: `${MEDIA}/brand/gramcarbon-logo.png`,
};

export interface Leader {
  photo: string;
  name: string;
  role: string;
  bio: string;
}

export const team: Leader[] = [
  {
    photo: `${MEDIA}/team/ani-varghese.webp`,
    name: "Ani Varghese",
    role: "founder & director",
    bio: "Educator turned entrepreneur with 6+ years in climate tech.",
  },
  {
    photo: `${MEDIA}/team/smitha-v.webp`,
    name: "Smitha V",
    role: "co-founder & director",
    bio: "10+ years in academia; builds ventures with lasting community impact.",
  },
  {
    photo: `${MEDIA}/team/ravi-k-a.webp`,
    name: "Ravi K A",
    role: "strategy & growth",
    bio: "Agribusiness and rural-finance leader, founder of Dvara E-Dairy.",
  },
  {
    photo: `${MEDIA}/team/krishna-kumar.webp`,
    name: "Krishna Kumar",
    role: "chief of sustainability",
    bio: "30 years in procurement and GHG audits at SPIE, ABB and EcoVadis.",
  },
  {
    photo: `${MEDIA}/team/m-hazeem.webp`,
    name: "M Hazeem",
    role: "legal & governance",
    bio: "9+ years as a practising Company Secretary.",
  },
];

export interface Advisor {
  photo: string;
  name: string;
  affiliation: string;
}

export const advisors: Advisor[] = [
  {
    photo: `${MEDIA}/advisors/gert-van-duinkerken.webp`,
    name: "Gert van Duinkerken",
    affiliation: "Wageningen Livestock Research",
  },
  {
    photo: `${MEDIA}/advisors/veerasamy-sejian.webp`,
    name: "Veerasamy Sejian",
    affiliation: "Principal Scientist, climate-resilient livestock",
  },
  {
    photo: `${MEDIA}/advisors/trevor-tomkins.webp`,
    name: "Trevor Tomkins",
    affiliation: "Former CEO, Milk Specialties Global; Akshayakalpa",
  },
];

export interface ProjectShot {
  name: string;
  role: string;
  bio: string;
  photo: string;
  alt: string;
  /** the file's native pixel size: sets the aspect before it loads, and caps how far a cutout is enlarged */
  w: number;
  h: number;
  /** a background-removed figure, sat on the card's tint instead of filling it */
  cutout?: boolean;
}

export const projects: ProjectShot[] = [
  {
    name: "Kerala",
    role: "feed trials · milma",
    bio: "Field trials with KVASU and feed testing with Milma cooperatives.",
    photo: `${MEDIA}/projects/kerala-kvasu-milma.webp`,
    alt: "Kerala: feed trials with KVASU and testing with Milma",
    w: 456,
    h: 452,
    cutout: true,
  },
  {
    name: "Rajasthan",
    role: "corridor development",
    bio: "Clean dairy corridor linking fodder farms, FPOs and processing plants.",
    photo: `${MEDIA}/projects/rajasthan-corridor.webp`,
    alt: "Rajasthan: corridor development",
    w: 239,
    h: 334,
    cutout: true,
  },
  {
    name: "Milky Mist",
    role: "Tamil Nadu · CH₄OW",
    bio: "Commercial cattle feed fortified with CH₄OW cutting enteric methane at the source.",
    photo: `${MEDIA}/projects/milky-mist-tamil-nadu.webp`,
    alt: "Milky Mist, Tamil Nadu: CH₄OW-fortified cattle feed",
    w: 1400,
    h: 883,
  },
  {
    name: "Nainarpalayam",
    role: "Tamil Nadu · Gates-supported",
    bio: "Gates Foundation-supported field deployment with women dairy farmers.",
    photo: `${MEDIA}/projects/nainarpalayam-tamil-nadu.webp`,
    alt: "Nainarpalayam, Tamil Nadu: Gates-supported field work with women dairy farmers",
    w: 1400,
    h: 933,
  },
];

export interface Partner {
  logo: string;
  name: string;
  /** intrinsic pixel size of the logo file */
  w: number;
  h: number;
}

export const partners: Partner[] = [
  { logo: `${MEDIA}/partners/icar.webp`, name: "ICAR", w: 289, h: 359 },
  { logo: `${MEDIA}/partners/bill-melinda-gates-foundation.svg`, name: "Bill & Melinda Gates Foundation", w: 360, h: 76 },
  { logo: `${MEDIA}/partners/grand-challenges-india.webp`, name: "Grand Challenges India", w: 299, h: 203 },
  { logo: `${MEDIA}/partners/birac.webp`, name: "BIRAC", w: 360, h: 203 },
  { logo: `${MEDIA}/partners/cgiar.svg`, name: "CGIAR", w: 220, h: 257 },
  { logo: `${MEDIA}/partners/agrinnovate-india.webp`, name: "Agrinnovate India", w: 328, h: 290 },
  { logo: `${MEDIA}/partners/naarm-a-idea-hq.webp`, name: "NAARM a-IDEA", w: 599, h: 511 },
  { logo: `${MEDIA}/partners/t-hub.webp`, name: "T-Hub", w: 150, h: 127 },
  { logo: `${MEDIA}/partners/kerala-startup-mission.svg`, name: "Kerala Startup Mission", w: 330, h: 184 },
  { logo: `${MEDIA}/partners/afc-india.webp`, name: "AFC India", w: 200, h: 200 },
];

export const contact = {
  email: "info@zeroearth.company",
  phone: "+91 79076 35263",
  phoneHref: "tel:+917907635263",
  demoMail: "mailto:info@zeroearth.company?subject=gramCarbon%20demo%20request",
  address: ["STPI, Phase 1, Technopark,", "Thiruvananthapuram, Kerala, 695581"],
};
