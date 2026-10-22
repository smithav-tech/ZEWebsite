/**
 * The lists the sections render, and every image path. Prose that sits inside
 * a single section lives in that section's component.
 */

const MEDIA = "/media/client";

/**
 * A file in public/media/client, with its content hash on the URL
 * (vite.config.ts): a replaced photo gets a new URL, so no browser shows the
 * old one from its cache, and an unchanged one stays cached.
 */
function media(path: string) {
  const version = __MEDIA_VERSIONS__[path];
  return version ? `${MEDIA}/${path}?v=${version}` : `${MEDIA}/${path}`;
}

export const brand = {
  logo: media("brand/zeroearth-logo.png"),
  gramCarbonLogo: media("brand/gramcarbon-logo.png"),
};

export interface Leader {
  photo: string;
  name: string;
  role: string;
  bio: string;
}

export const team: Leader[] = [
  {
    photo: media("team/ani-varghese.webp"),
    name: "Ani Varghese",
    role: "founder & director",
    bio: "Educator turned entrepreneur with 6+ years in climate tech.",
  },
  {
    photo: media("team/smitha-v.webp"),
    name: "Smitha V",
    role: "co-founder & director",
    bio: "10+ years in academia; builds ventures with lasting community impact.",
  },
  {
    photo: media("team/ravi-k-a.webp"),
    name: "Ravi K A",
    role: "strategy & growth",
    bio: "Agribusiness and rural-finance leader, founder of Dvara E-Dairy.",
  },
  {
    photo: media("team/krishna-kumar.webp"),
    name: "Krishna Kumar",
    role: "chief of sustainability",
    bio: "30 years in procurement and GHG audits at SPIE, ABB and EcoVadis.",
  },
  {
    photo: media("team/m-hazeem.webp"),
    name: "M Hazeem",
    role: "legal & governance",
    bio: "9+ years as a practising Company Secretary.",
  },
];

export interface Advisor {
  photo: string;
  name: string;
  affiliation: string;
  bio: string;
}

export const advisors: Advisor[] = [
  {
    photo: media("advisors/trevor-tomkins.webp"),
    name: "Dr. Trevor Tomkins",
    affiliation: "President & Founder, venture | dairy",
    bio: "Dr. Trevor Tomkins is an experienced expert in dairy science, animal nutrition, and the global dairy industry. He is the President and Founder of venture | dairy, supporting dairy-sector development and business growth. He has held senior leadership roles, including President of Milk Specialties Company, and has extensive international experience in dairy production and processing. His work focuses on sustainable dairy development, improving milk quality, strengthening dairy value chains, and supporting rural prosperity.",
  },
  {
    photo: media("advisors/gert-van-duinkerken.webp"),
    name: "Dr. Gert van Duinkerken",
    affiliation: "Director, Wageningen Livestock Research",
    bio: "Dr. Gert van Duinkerken is an expert in animal nutrition and livestock farming, with extensive experience in agricultural research. He serves as Director of Wageningen Livestock Research at Wageningen University & Research in the Netherlands. His work focuses on sustainable livestock production, animal nutrition, and improving farming practices. He is committed to advancing climate-friendly agriculture while balancing environmental sustainability and livestock productivity.",
  },
  {
    photo: media("advisors/veerasamy-sejian.webp"),
    name: "Dr. Sejian Veerasamy",
    affiliation: "Principal Scientist, ICAR–NIANP, Bengaluru",
    bio: "Dr. Sejian Veerasamy is a Principal Scientist at ICAR–National Institute of Animal Nutrition and Physiology (NIANP), Bengaluru, India. His research focuses on climate change impacts on livestock, animal physiology, and environmental stress adaptation. He works on developing climate-resilient sheep and goat breeds that can withstand heat stress and changing environmental conditions. His work contributes to sustainable livestock production and strategies to reduce greenhouse gas emissions from agriculture.",
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
    photo: media("projects/kerala-kvasu-milma.webp"),
    alt: "Kerala: a young brown cow in a halter in a misty green pasture",
    w: 1400,
    h: 933,
  },
  {
    name: "Rajasthan",
    role: "corridor development",
    bio: "Clean dairy corridor linking fodder farms, FPOs and processing plants.",
    photo: media("projects/rajasthan-corridor.webp"),
    alt: "Rajasthan: a red cow with a dark calf beside a water trough",
    w: 949,
    h: 1400,
  },
  {
    name: "Milky Mist",
    role: "Tamil Nadu · CH₄OW",
    bio: "Commercial cattle feed fortified with CH₄OW cutting enteric methane at the source.",
    photo: media("projects/milky-mist-tamil-nadu.webp"),
    alt: "Milky Mist, Tamil Nadu: a smiling girl beside grain drying on the road",
    w: 1400,
    h: 1355,
  },
  {
    name: "Nainarpalayam",
    role: "Tamil Nadu · Gates-supported",
    bio: "Gates Foundation-supported field deployment with women dairy farmers.",
    photo: media("projects/nainarpalayam-tamil-nadu.webp"),
    alt: "Nainarpalayam, Tamil Nadu: women dairy farmers with the MCC@100 Milk Climate Cooperative Project banner",
    w: 1400,
    h: 701,
  },
];

/** the field gallery on /projects: real photos from the programmes, all cropped to 960 x 1200 (4:5, the card frame) */
export const fieldPhotos: { photo: string; alt: string }[] = [
  { photo: media("gallery/field-01.webp"), alt: "A smiling woman dairy farmer at a cooperative meeting" },
  { photo: media("gallery/field-02.webp"), alt: "A red cow and a dark calf looking at the camera" },
  { photo: media("gallery/field-03.webp"), alt: "Women dairy farmers going through forms together" },
  { photo: media("gallery/field-04.webp"), alt: "A CH4OW feed bag on a farm, with a buffalo behind it" },
  { photo: media("gallery/field-05.webp"), alt: "A farmer seated outside a village house" },
  { photo: media("gallery/field-06.webp"), alt: "A CH4OW feed bag on top of wrapped silage bales" },
  { photo: media("gallery/field-07.webp"), alt: "A woman farmer listening at a cooperative meeting" },
  { photo: media("gallery/field-08.webp"), alt: "A milk collector riding down a tree-lined village road" },
  { photo: media("gallery/field-09.webp"), alt: "A woman farmer smiling during a training session" },
  { photo: media("gallery/field-10.webp"), alt: "A village street of painted houses under a grey sky" },
];

export interface Partner {
  logo: string;
  name: string;
  /** intrinsic pixel size of the logo file */
  w: number;
  h: number;
}

export const partners: Partner[] = [
  { logo: media("partners/icar.webp"), name: "ICAR", w: 289, h: 359 },
  { logo: media("partners/bill-melinda-gates-foundation.svg"), name: "Bill & Melinda Gates Foundation", w: 360, h: 76 },
  { logo: media("partners/grand-challenges-india.webp"), name: "Grand Challenges India", w: 299, h: 203 },
  { logo: media("partners/birac.webp"), name: "BIRAC", w: 360, h: 203 },
  { logo: media("partners/cgiar.svg"), name: "CGIAR", w: 220, h: 257 },
  { logo: media("partners/agrinnovate-india.webp"), name: "Agrinnovate India", w: 328, h: 290 },
  { logo: media("partners/naarm-a-idea-hq.webp"), name: "NAARM a-IDEA", w: 599, h: 511 },
  { logo: media("partners/t-hub.webp"), name: "T-Hub", w: 150, h: 127 },
  { logo: media("partners/kerala-startup-mission.svg"), name: "Kerala Startup Mission", w: 330, h: 184 },
  { logo: media("partners/afc-india.webp"), name: "AFC India", w: 200, h: 200 },
];

export const contact = {
  email: "info@zeroearth.company",
  phone: "+91 79076 35263",
  phoneHref: "tel:+917907635263",
  demoMail: "mailto:info@zeroearth.company?subject=gramCarbon%20demo%20request",
  address: ["STPI, Phase 1, Technopark,", "Thiruvananthapuram, Kerala, 695581"],
  /** the office, 8°33'21.7"N 76°52'51.2"E */
  office: { lat: 8.556028, lng: 76.880889 },
};
