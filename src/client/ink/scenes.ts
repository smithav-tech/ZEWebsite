import { Pen, type Pt } from "./pen";
import type { InkScene } from "./types";
import { WORDMARK } from "./drawn";

/**
 * The doodles the ink line draws, in page order. Most are redrawn as single
 * clean continuous lines with the Pen (smooth curves through a few points,
 * rounded corners on machines, one pass per stroke with no retracing); the
 * wordmark is the original drawing, smoothed
 * (drawn.ts). InkLine fits each w x h box into its `.doodle-box` and rewrites
 * the points into page coordinates.
 *
 * Conventions, which InkLine and the links rely on:
 * - every scene but the hero (where the line begins) and the finale (which
 *   starts on the z of the logo, so the line runs into it) starts at its
 *   top-right corner heading down, so a line coming down the right margin
 *   (phones) flows straight in; `lead`
 *   counts the segments of that lead-in, which are skipped when the drawing
 *   sits beside the copy and the link can join it where the lead-in ends;
 * - every scene but the last ends on its bottom edge heading down;
 * - labels sit clear of the line at every size (at least ~7px on a phone).
 */

/**
 * Hero: a dairy cow facing right, her head turned to look out at us with her
 * ears held out either side, and her calf standing in front of her
 * hindquarters, facing left and looking out too, drawn as one clean pass.
 * Behind the calf, the cow's near hind leg shows under its belly.
 *
 * The line starts at the cow's tailhead and runs down her rump to the calf's
 * back, goes round the calf clockwise (along its back, out along its raised
 * tail and back, down the buttock and both hind legs past the hocks, along
 * the belly, down the cow's hind leg and up again behind it, along the belly
 * again exactly over itself, down both
 * forelegs past the knees, up the chest and throat, round the muzzle, the
 * ears and the poll, and along the neck), climbs the rump again exactly over
 * itself, and runs along the cow's topline to her ears and poll, down her
 * face round the broad muzzle, and down the throat and chest to the brisket.
 * It goes down the near foreleg and up the far one, back along the belly to
 * the calf, follows the calf's hind leg down again exactly over itself, and
 * leaves from its heel as the thread for the next section.
 */
const COW_TAILHEAD: [number, number] = [402, 252];
const CALF_BACK: [number, number] = [421, 411];

function cowAndCalf() {
  const p = new Pen(...COW_TAILHEAD, [-0.5, 1]);
  // down the cow's rump to the calf's back
  const rump = p.count;
  p.through([[393, 276], [393, 300], [400, 328], [408, 360], [415, 388], CALF_BACK], [0.12, 1]);
  const rumpEnd = p.count;

  // calf: along its back to the tailhead
  p.corner().through([[449, 414], [483, 414], [517, 410], [551, 404], [585, 403], [618, 409], [642, 424], [663, 443]]);
  // the tail, raised and swishing out, its tuft, and back exactly over it
  const tailFrom = p.count;
  p.through([[684, 444], [704, 454], [718, 470], [724, 488], [736, 496], [736, 516, 1], [722, 512], [718, 498], [724, 488, 1]]);
  p.retrace(tailFrom);
  // down the buttock to where the cow's belly meets it
  p.corner().through([[669, 462], [667, 486], [661, 510], [654, 531]]);
  const rear = p.count;
  // the near hind leg: back of the thigh, the point of the hock, cannon, fetlock, heel
  p.through([[650, 560], [648, 592], [656, 628], [648, 668], [646, 708], [648, 736], [640, 754], [634, 770, 1]]);
  const heel = p.count;
  // round the hoof and up its front, past the hock, to the stifle
  p.through([[608, 771, 1], [612, 753], [618, 742], [622, 718], [622, 688], [626, 650], [620, 614], [608, 594, 1]]);
  // the far hind leg, behind it
  p.through([[604, 622], [608, 648], [598, 690], [596, 730], [588, 754], [582, 770, 1], [556, 771, 1], [560, 753], [566, 742], [570, 716], [570, 688], [574, 652], [570, 616], [560, 594], [544, 585]], [-1, 0]);
  // the belly, straight where the cow's hind leg stands behind it
  p.line(500, 584).line(452, 584);
  // under it, the cow's near hind leg, broad and angled at the hock: down its
  // back to the point of the hock, down the cannon, round the big hoof, up its
  // front to the stifle; then back along the calf's belly, exactly over it
  p.corner().through([[446, 620], [440, 650], [438, 666], [448, 700], [456, 730], [462, 746], [470, 758], [474, 770, 1], [514, 771, 1], [506, 750], [496, 734], [490, 714], [486, 690], [482, 666], [488, 628], [500, 584, 1]]);
  p.line(452, 584).line(422, 584);
  p.through([[396, 584], [380, 584, 1]]);
  // the far foreleg: down its back past the knee, round the hoof, up its front
  p.through([[378, 620], [374, 652], [376, 672], [374, 702], [376, 734], [368, 754], [362, 770, 1], [338, 771, 1], [342, 753], [348, 742], [350, 716], [350, 688], [344, 670], [346, 640], [342, 608, 1]]);
  // the near foreleg, in front
  p.through([[332, 640], [328, 668], [328, 700], [328, 736], [320, 756], [314, 770, 1], [288, 771, 1], [292, 753], [298, 742], [302, 716], [302, 690], [296, 668], [294, 640], [286, 606], [270, 590]]);
  // up the chest and the throat, round the muzzle, out along the ear,
  // over the poll, out along the other ear, and back along the neck
  p.through([[252, 580], [238, 560], [230, 540], [222, 521], [211, 501], [196, 484], [178, 471], [160, 468], [148, 458], [148, 440], [157, 428], [160, 414], [157, 397]]);
  p.through([[144, 394], [130, 386], [121, 373], [124, 361], [138, 358], [156, 361], [170, 364]]);
  p.through([[184, 354], [200, 341], [214, 343], [226, 356], [240, 367]]);
  p.through([[252, 359], [266, 358], [277, 366], [276, 380], [284, 389], [304, 395], [330, 399], [360, 403], [392, 408], CALF_BACK], [1, 0.08]);

  // back up the cow's rump, exactly over it, and along her topline: hooks, loin, back, withers
  p.retrace(rump, rumpEnd);
  p.through([[416, 243], [432, 233], [444, 218], [458, 207], [489, 194], [525, 189], [561, 189], [596, 194], [632, 200], [667, 207], [703, 209], [739, 207], [775, 204], [811, 200], [847, 196], [882, 188], [918, 184], [954, 181], [989, 172], [1006, 165]]);
  // her ear held out, over the poll, the other ear
  p.through([[1015, 152], [1010, 138], [1020, 125], [1038, 119], [1056, 121], [1068, 132], [1080, 130]]);
  p.through([[1092, 114], [1108, 98], [1126, 90], [1144, 96], [1160, 112], [1174, 126]]);
  p.through([[1190, 127], [1208, 120], [1232, 119], [1254, 125], [1259, 142], [1248, 158], [1228, 171], [1202, 177]]);
  // down her face, round the broad muzzle, and down the throat and chest to the brisket
  p.through([[1197, 200], [1200, 226], [1213, 242], [1215, 270], [1204, 288], [1186, 295], [1164, 299], [1144, 314], [1124, 334], [1108, 360], [1096, 386], [1090, 414], [1088, 446], [1082, 480], [1066, 512], [1044, 534], [1016, 548], [987, 552]]);
  // the near foreleg: down its front past the knee, round the hoof, up its back
  p.through([[976, 572], [970, 604], [966, 636], [966, 660], [968, 690], [974, 714], [980, 732], [986, 752], [990, 770, 1], [960, 771, 1], [956, 752], [950, 734], [944, 716], [940, 688], [938, 656], [934, 620], [930, 576, 1]]);
  // the far foreleg, behind it: down its front, round the hoof, up its back to the elbow
  p.through([[924, 604], [922, 638], [924, 660], [920, 690], [922, 716], [930, 738], [934, 756], [938, 770, 1], [908, 771, 1], [906, 752], [900, 734], [896, 714], [896, 684], [894, 654], [892, 620], [890, 580], [886, 530]]);
  // the belly, back to the calf
  p.through([[866, 518], [829, 524], [794, 533], [759, 540], [723, 544], [687, 541], [654, 531]], [-1, -0.25]);
  // down the calf's hind leg again, exactly over it, to the heel, and away
  p.again(rear, heel);
  p.through([[634, 812], [634, 856]], [0, 1]);
  return p.d;
}

/**
 * Feed and TMR: in over the top and down onto the field, through a clump of
 * fodder grass (tapering blades fanning from one root, the outer ones arching
 * over, a seed head in the middle), along the bed of a trailer round its
 * wheel, up its front and back along its rail under three rolled bales of hay,
 * down its back and along the bed again (exactly over it), then along the
 * drawbar to the tractor: over the fender of the big rear wheel, round the cab
 * and its roof, along the hood past the exhaust stack, down the grille, round
 * the small front wheel, back along the chassis into the rear wheel's rim, round
 * its lugged tyre, and down off it into a bowl of TMR.
 *
 * A few strokes are run back over exactly so the picture stays one line: the
 * bales' rolls, the trailer's bed, the cab's sill, the axle and a quarter of
 * the tyre.
 */
function feedToBowl() {
  const G = 330; // the field
  const p = new Pen(600, 0, [0, 1]);
  // over the top and down the left onto the field
  p.rounded([[600, 64], [74, 64], [74, 100]], 24);
  const lead = p.count;
  p.through([[36, 148], [22, 226], [24, 296], [40, G, 1]]);
  p.line(97, G).corner();

  // a blade of grass: a narrow loop from the pen at b0 out to a pointed tip and
  // back to b1, along a curved spine (a quadratic from between b0 and b1 through c)
  const leaf = (b0: [number, number], b1: [number, number], c: [number, number], tip: [number, number]) => {
    const m = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2];
    const hw = Math.hypot(b1[0] - b0[0], b1[1] - b0[1]) / 2;
    const side0 = Math.sign((b0[0] - m[0]) * (m[1] - c[1]) + (b0[1] - m[1]) * (c[0] - m[0])) || -1;
    const edge = (s: number, side: number): Pt => {
      const u = 1 - s;
      const x = u * u * m[0] + 2 * u * s * c[0] + s * s * tip[0];
      const y = u * u * m[1] + 2 * u * s * c[1] + s * s * tip[1];
      const dx = 2 * u * (c[0] - m[0]) + 2 * s * (tip[0] - c[0]);
      const dy = 2 * u * (c[1] - m[1]) + 2 * s * (tip[1] - c[1]);
      const l = Math.hypot(dx, dy);
      const w = hw * u ** 0.8 * side * side0;
      return [x - (dy / l) * w, y + (dx / l) * w];
    };
    p.through([edge(0.3, 1), edge(0.6, 1), edge(0.85, 1), [...tip, 1], edge(0.85, -1), edge(0.6, -1), edge(0.3, -1), [...b1, 1]]);
  };
  // fodder grass: a clump of blades fanning from one root, the outer ones arching over, a seed head in the middle
  const blade = (bx: number, c: [number, number], tip: [number, number]) => leaf([bx - 5, G], [bx + 5, G], c, tip);
  blade(102, [74, 206], [50, 250]);
  blade(112, [98, 200], [80, 158]);
  // the seed head on its stalk
  p.through([[119, 280], [120, 226], [119, 192], [115, 176], [114, 156], [115, 136], [119, 112, 1]]);
  p.through([[123, 136], [124, 156], [123, 176], [121, 192], [122, 226], [124, 280], [127, G, 1]]);
  blade(132, [144, 196], [160, 150]);
  blade(142, [166, 222], [176, 258]);

  // along the field to the back of the trailer, and along its bed round the wheel
  const [t0, t1, top, bed] = [198, 334, 254, 288];
  p.through([[168, G], [188, 324], [t0 - 1, 304], [t0, bed]], [0, -1]);
  const under = p.count;
  p.corner().line(266, bed).arc(266, bed + 21, 360).line(t1, bed);
  const underEnd = p.count;
  // up its front, and back along the rail under three round bales of hay
  p.line(t1, top).corner();
  // a bale's roll: from the pen, at `deg` on its rim, spiralling in clockwise
  // a turn and a half, then run back out over itself
  const roll = (x: number, y: number, deg: number, r = 30) => {
    const from = p.count;
    const pts: Pt[] = [];
    for (let k = 1; k <= 18; k++) {
      const a = ((deg + k * 30) * Math.PI) / 180;
      const rr = r - ((r - 7) * k) / 18;
      pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]);
    }
    p.through(pts).retrace(from).corner();
  };
  const [ax, bx, by] = [234, 298, top - 30];
  const [ux, uy] = [(ax + bx) / 2, by - Math.sqrt(60 ** 2 - ((bx - ax) / 2) ** 2)];
  // the front bale: once round from where it sits on the rail, and its roll
  p.line(bx, top).arc(bx, by, 360);
  roll(bx, by, 90);
  // the back bale, broken off where the top one rests on it to go round that one first
  p.line(ax, top);
  const touch = (Math.atan2(uy - by, ux - ax) * 180) / Math.PI + 360;
  p.arc(ax, by, touch - 90).arc(ux, uy, 360);
  roll(ux, uy, touch - 180);
  p.arc(ax, by, 450 - touch);
  roll(ax, by, 90);
  // on along the rail, down the back, and along the bed again
  p.corner().line(t0, top).line(t0, bed).corner();
  p.again(under, underEnd);

  // the tractor, about its rear axle (wx, wy): the drawbar, the hitch, and over the fender to the cab
  const [wx, wy] = [436, 264];
  const fender = (deg: number): [number, number] => [wx + 72 * Math.cos((deg * Math.PI) / 180), wy + 72 * Math.sin((deg * Math.PI) / 180)];
  const [hx, hy] = fender(194);
  const [px, py] = fender(241.8);
  p.corner().line(358, 282).corner().line(hx, hy).corner().arc(wx, wy, 241.8 - 194);
  // the sill under the cab window, then round the cab: up the front, the roof, down the back
  const sill = p.count;
  p.arc(wx, wy, 270 - 241.8).line(wx + 46, wy - 72);
  const sillEnd = p.count;
  p.corner().rounded([[wx + 46, 120], [wx + 54, 120], [wx + 54, 110], [wx - 42, 110], [wx - 42, 120], [px, 120], [px, py]], 3);
  // ...along the sill again, down to the hood, the exhaust stack, the grille
  p.corner().again(sill, sillEnd);
  p.line(wx + 46, 212).corner();
  p.line(wx + 120, 212).corner();
  p.rounded([[wx + 120, 156], [wx + 131, 150], [wx + 131, 212]], 2).corner();
  const [fx, fy, fr] = [wx + 156, 296, 34];
  const fd = Math.sqrt(fr * fr - (fy - wy) ** 2);
  p.rounded([[wx + 190, 212], [wx + 190, wy], [fx + fd, wy]], 8);
  // round the front wheel, back along the chassis to the rear wheel, in to its rim and round it
  p.corner().arc(fx, fy, 360 - (2 * Math.atan2(fd, fy - wy) * 180) / Math.PI);
  p.corner().line(wx + 66, wy);
  const axle = p.count;
  p.line(wx + 36, wy);
  p.arc(wx, wy, 360);
  p.retrace(axle, axle + 1);
  // the rear tyre, its lugs, once round and on to the bottom again
  const tyre = p.count;
  const lugs: Pt[] = [];
  for (let i = 1; i <= 48; i++) {
    const a = (i * Math.PI) / 24;
    const r = i % 2 ? 63 : 66;
    lugs.push([wx + r * Math.cos(a), wy + r * Math.sin(a)]);
  }
  p.corner().through(lugs);
  p.again(tyre, tyre + 12);

  // down off the tyre into the bowl: TMR heaped above the rim, the rim, the bowl, away
  p.through([[412, 338], [398, 366], [392, 404, 1]]);
  p.through([[382, 382], [364, 368], [342, 384, 1], [320, 366], [296, 382, 1], [272, 368], [252, 380], [242, 404, 1]]);
  p.line(392, 404).corner();
  p.through([[374, 448], [316, 472], [258, 448], [242, 404, 1]]);
  p.corner().line(242, 520);
  return { d: p.d, lead };
}

/**
 * Green energy, left to right along one ground line: in over the top and down
 * to a grazing cow, round her; along to the steaming heap of her manure; up
 * and over the biogas plant, with a pipe rising from its dome past an arrow
 * to a drop of CBG; along to a bin of organic fertiliser with a sprout growing
 * from it; and on to the fodder field, three plants growing taller, before
 * dropping straight down to the bottom. The tail, steam, pipe, arrow and stems run
 * back exactly over themselves, so the picture stays one line.
 */
function manureToFields() {
  const p = new Pen(600, 0, [0, 1]);
  // over the top and down to the ground on the left
  p.rounded([[600, 64], [40, 64], [40, 150]], 24);
  const lead = p.count;
  p.through([[18, 232], [14, 320], [20, 370], [34, 382, 1]]);

  // the cow, facing right, head up: up the back of a hind leg, round the rump,
  // down the tail to its tuft and back, along the back, up the neck to the ear
  // and the horn, down the face to the muzzle, back along the jaw and the
  // throat to the chest; then down, under and up each leg in turn, front to
  // back, with the udder between the belly and the hind legs
  p.line(62, 382).corner().through([[62, 350], [58, 330], [58, 312], [66, 300]]);
  const tail = p.count;
  p.through([[56, 308], [52, 326], [52, 342], [48, 352], [54, 356, 1]]);
  p.retrace(tail);
  p.through([[100, 296], [138, 296], [152, 296], [164, 288], [170, 282, 1]]);
  // the ear held out sideways, a short horn, and on down the face
  p.through([[160, 280], [148, 284, 1], [160, 290], [172, 287, 1], [174, 276], [180, 268, 1], [180, 278], [182, 287, 1], [188, 294], [192, 302], [198, 316], [192, 324], [180, 322], [168, 314, 1], [160, 324], [156, 340], [156, 382, 1]]);
  p.line(147, 382).corner().line(147, 350).corner().line(141, 350).corner().line(141, 382).corner().line(132, 382).corner();
  p.through([[132, 346, 1], [110, 344], [100, 344, 1], [98, 352], [94, 357], [90, 352], [88, 345, 1], [85, 350], [85, 382, 1]]);
  p.line(76, 382).corner().line(76, 350).corner().line(71, 350).corner().line(71, 382).corner();

  // along the ground to the manure: a heap in three soft tiers
  p.line(202, 382).corner().through([[206, 370], [214, 362, 1], [214, 352], [222, 344, 1], [224, 336], [232, 330]]);
  // a curl of steam rising off it, and back down exactly over it
  const steam = p.count;
  p.through([[228, 316], [236, 302], [230, 288], [236, 276]]);
  p.retrace(steam);
  p.through([[240, 336], [240, 344, 1], [248, 352], [248, 362, 1], [254, 370], [258, 382, 1]]);

  // along to the biogas plant: up its wall and over its dome to the top
  p.line(272, 382).corner().through([[272, 340], [272, 318, 1], [284, 292], [300, 274], [320, 268]], [1, 0]);
  // a pipe rising from the dome past an arrow to a drop of CBG, and back down
  const pipe = p.count;
  p.corner().line(320, 248);
  const arrow = p.count;
  p.line(310, 258);
  p.retrace(arrow);
  const arrow2 = p.count;
  p.line(330, 258);
  p.retrace(arrow2);
  const pipeUp = p.count;
  p.line(320, 222);
  const pipeTop = p.count;
  p.corner().through([[296, 200], [290, 174], [304, 148], [320, 118, 1], [336, 148], [350, 174], [344, 200], [320, 222, 1]]);
  p.retrace(pipeUp, pipeTop);
  p.retrace(pipe, pipe + 1);
  // over the rest of the dome and down its far wall
  p.corner().through([[340, 274], [356, 292], [368, 318, 1], [368, 340], [368, 382, 1]]);

  // along to the bin of fertiliser: up its slanting side, over the compost heaped in it
  p.line(392, 382).corner().through([[386, 330, 1], [398, 322], [412, 314], [426, 312]], [1, 0]);
  // a sprout growing from it: up the stem, round both leaves, and back down the stem
  const stem = p.count;
  p.corner().line(426, 290);
  const stemTop = p.count;
  p.corner().through([[438, 276], [452, 276], [446, 290], [426, 290, 1]]);
  p.corner().through([[414, 278], [400, 280], [406, 292], [426, 290, 1]]);
  p.retrace(stem, stemTop);
  p.corner().through([[442, 316], [458, 324], [468, 330, 1], [462, 382, 1]]);

  // on to the fodder field: three plants growing taller, each up its stem,
  // round a pointed leaf to either side, and back down
  const leaf = (x: number, y: number, side: 1 | -1, l: number) => {
    p.corner().through([[x + side * l * 0.45, y - l * 0.56], [x + side * l, y - l * 0.62, 1], [x + side * l * 0.6, y - l * 0.12], [x, y, 1]]);
  };
  const plant = (x: number, h: number) => {
    p.line(x, 382);
    const low = p.count;
    p.corner().line(x, 382 - h * 0.45);
    leaf(x, 382 - h * 0.45, -1, h * 0.36);
    const high = p.count;
    p.corner().line(x, 382 - h * 0.7);
    leaf(x, 382 - h * 0.7, 1, h * 0.36);
    p.corner().line(x, 382 - h);
    p.retrace(high + 1);
    p.retrace(high, high + 1);
    p.retrace(low, low + 1);
    p.corner();
  };
  plant(496, 44);
  plant(544, 62);
  plant(594, 80);
  p.line(616, 382);

  // and straight down to the bottom
  p.corner().line(616, 540);
  return { d: p.d, lead };
}

/**
 * The corridor: one route through six stops, each drawn to read on its own.
 * In over the top and into the cow (facing left) at her tailhead, round her
 * and out down her tail; to the sack of CH4OW feed; to the TMR tractor; to
 * the milk can; down to the biogas plant on the ground, a dome with the CBG
 * flame burning on a pipe above it; and along the ground to the phone where
 * the data lands, a chart rising across its screen; then away. Stems, the
 * flame's pipe and the chart run back exactly over themselves, so the
 * picture stays one line; every way between stops is one straight stroke.
 */
function corridorRoute() {
  const p = new Pen(600, 0, [0, 1]);
  // in over the top to the cow's tailhead
  p.rounded([[600, 48], [238, 48], [238, 86]], 24);
  const lead = p.count;

  // the cow, facing left: down her rump and the hind legs
  p.through([[244, 104], [246, 126], [240, 146], [238, 190, 1], [224, 190, 1], [224, 160], [218, 156], [214, 190, 1], [200, 190, 1], [200, 160]]);
  // the udder and the belly
  p.through([[190, 164], [184, 174], [174, 176], [168, 166], [156, 162], [140, 162]]);
  // the forelegs, the chest and the dewlap
  p.through([[136, 190, 1], [122, 190, 1], [122, 164], [114, 162], [110, 190, 1], [96, 190, 1], [96, 158], [90, 144], [84, 134]]);
  // the head: under the jaw to a broad muzzle, up the face, an ear, a horn, the poll
  p.through([[70, 136], [54, 134], [42, 126], [42, 112], [52, 100], [60, 88], [48, 86], [40, 78], [52, 76], [64, 80], [70, 70], [74, 62], [80, 70], [82, 80], [94, 84]]);
  // along the neck and her back to the tailhead, and down her tail to its tuft
  p.through([[120, 86], [170, 84], [214, 84], [238, 86], [250, 98], [256, 120], [258, 150], [254, 160], [262, 170], [268, 160], [260, 152]]);

  // to the sack of CH4OW: up its side, the tied neck and the ruff, down the far side and round its foot
  p.corner().line(430, 176).corner();
  p.through([[426, 148], [436, 120], [456, 100], [448, 88, 1], [440, 74], [452, 68], [460, 78, 1], [470, 64], [482, 66], [486, 78, 1], [496, 70], [508, 76], [504, 88], [492, 98, 1]]);
  p.through([[514, 120], [526, 150], [522, 178], [500, 188], [456, 190], [432, 184], [430, 176, 1]]);

  // to the tractor (facing right), from the foot of its nose: up the nose, along the hood
  // past the exhaust stack (up and back), round the cab and down its back onto the big rear wheel
  p.line(268, 288).corner();
  p.rounded([[268, 250], [252, 250]], 4);
  const stack = p.count;
  p.corner().line(252, 232);
  p.retrace(stack);
  const [rx, ry, rr] = [165, 298, 32];
  const back = ry - Math.sqrt(rr * rr - 25 * 25);
  p.corner().rounded([[200, 250], [200, 214], [140, 214], [140, back]], 4).corner();
  // once round the rear wheel and on to where the chassis leaves it, along the chassis
  // to the top of the front wheel, once round that, and on to the nose
  const from = (Math.atan2(back - ry, 140 - rx) * 180) / Math.PI + 360;
  const chassis = 360 - (Math.asin((ry - 288) / rr) * 180) / Math.PI;
  p.arc(rx, ry, 360 + chassis - from).corner();
  p.line(250, 288).corner();
  p.arc(250, 310, 360).corner();
  p.line(268, 288).corner();

  // across to the milk can, round it from its left foot
  p.line(430, 314).corner();
  p.rounded([[430, 340], [512, 340], [512, 278], [500, 264], [500, 250], [508, 248], [508, 236], [490, 236], [488, 226], [454, 226], [452, 236], [434, 236], [434, 248], [442, 250], [442, 264], [430, 278], [430, 314]], 4).corner();

  // down to the biogas plant: up the dome from its right foot to the crown,
  // up the pipe to the CBG flame, round it, back down to the crown, and on round the dome
  p.line(214, 502).corner();
  p.through([[214, 474], [204, 448], [188, 434], [172, 430]], [-1, 0]);
  const pipe = p.count;
  p.corner().line(172, 414).corner();
  // the flame: a short tongue on the left, the tall one leaning right, round its rounded base
  p.through([[158, 408], [150, 394], [152, 378], [160, 366, 1], [166, 380], [172, 370], [174, 360], [182, 346, 1], [192, 364], [196, 384], [190, 404], [172, 414, 1]]);
  p.retrace(pipe);
  p.corner().through([[156, 434], [140, 448], [130, 474], [130, 502, 1]]);
  // along the ground to the phone, round it, and the chart rising across its screen (there and back)
  p.line(440, 502).corner();
  const phone = p.count;
  p.rounded([[510, 502], [510, 390], [440, 390], [440, 444]], 10);
  const chart = p.count;
  p.corner().through([[456, 434], [470, 442], [486, 422], [500, 410]]);
  p.retrace(chart);
  // down its side, along its foot again (exactly over it), and away
  p.corner().line(440, 502);
  p.again(phone, phone + 1);
  p.corner().line(500, 600);
  return { d: p.d, lead };
}

/**
 * gramCarbon, in reading order along one ground line: trace, measure, verify.
 * The line drops from above onto a map pin, through its top into the hole and
 * round it, back up, and round the pin to its point on the ground; along to a
 * bar chart, up its axis and back, over three rising bars; on to a shield
 * standing on its point, round it, and a tick inside it, which starts from the
 * shield's side; then away from the shield's point. Everything drawn twice is
 * drawn exactly over itself, so the picture stays one line.
 */
function traceMeasureVerify() {
  const p = new Pen(590, 0, [0, 1]);
  // in over the top, and the drop onto the pin
  p.rounded([[590, 52], [120, 52], [120, 150]], 24);
  const lead = p.count;

  // trace: the map pin, its head about (px, py), its point on the ground
  const [px, py, pr, hole, ground] = [120, 312, 54, 18, 440];
  const t = Math.acos(pr / (ground - py)) * (180 / Math.PI); // from straight down to where its sides leave the head
  const rim = (deg: number): [number, number] => [px + pr * Math.cos((deg * Math.PI) / 180), py + pr * Math.sin((deg * Math.PI) / 180)];
  // down onto its top, on through into the hole, round it, and back up to the top
  p.line(px, py - pr);
  const into = p.count;
  p.line(px, py - hole);
  p.arc(px, py, 360);
  p.retrace(into, into + 1);
  // round the head to its right side, down to the point, up the left side and over to the top
  p.arc(px, py, 180 - t).corner();
  p.line(px, ground).corner();
  const left = p.count;
  p.line(...rim(90 + t)).corner();
  p.arc(px, py, 270 - (90 + t));
  // ...back down that side exactly over itself to the point
  p.retrace(left);

  // measure: along the ground to the chart's axis, up it and back, then three rising bars
  p.corner().line(222, ground).corner();
  const axis = p.count;
  p.line(222, 256);
  p.retrace(axis);
  p.corner().rounded([[240, 440], [240, 392], [268, 392], [268, 440], [282, 440], [282, 346], [310, 346], [310, 440], [324, 440], [324, 296], [352, 296], [352, 440], [470, 440]], 3).corner();

  // verify: the shield from its point, up its left side, over its arched top, down to the point
  const low = p.count;
  p.through([[442, 424], [416, 396], [408, 352]], [0, -1]);
  const wall = p.count;
  p.through([[408, 300, 1]]);
  p.through([[438, 292], [470, 283], [502, 292], [532, 300, 1]]);
  p.through([[532, 362], [524, 396], [498, 424], [470, 440, 1]]);
  // back round to its left side, the tick, back out, and down that side again to the point
  p.retrace(wall);
  p.corner().line(450, 394).corner().line(512, 326);
  p.retrace(p.count - 2);
  p.retrace(low, wall);
  // and straight down, away
  p.corner().line(470, 540);
  return { d: p.d, lead };
}

/**
 * CH4OW, methane held down: CH4 bubbles caught and sent back down an arrow
 * into the board, laid out round the arrow's centre line. In from the
 * top-right to the big bubble, which sits straight over the arrow; each bubble
 * is drawn once round with a highlight curling in off its rim (and back out
 * exactly over itself). From the big bubble out past a tiny bubble to the left
 * one, on past another to the smallest, and back exactly over all of that to
 * the big bubble; down its left stream into the arrow, round the arrow and up
 * the right stream (the two pour in like a funnel); along the bubble and out
 * past a tiny bubble to the right-hand one, and down to the bottom edge.
 */
function methaneBubbles() {
  type Bubble = [cx: number, cy: number, r: number];
  const BIG: Bubble = [330, 130, 74];
  const LEFT: Bubble = [196, 262, 44];
  const SMALL: Bubble = [232, 392, 26];
  const RIGHT: Bubble = [462, 290, 36];
  const at = ([cx, cy, r]: Bubble, deg: number, k = 1): [number, number] => [
    cx + r * k * Math.cos((deg * Math.PI) / 180),
    cy + r * k * Math.sin((deg * Math.PI) / 180),
  ];
  /** degrees from `a` on to `b`, turning one way (1 clockwise, -1 anticlockwise) */
  const turn = (a: number, b: number, dir: 1 | -1) => dir * ((((dir * (b - a)) % 360) + 360) % 360);

  const p = new Pen(640, 0, [0, 1]);
  // the lead-in, arriving on top of the big bubble heading left
  p.rounded([[640, BIG[1] - BIG[2]], at(BIG, -90)], 24);
  const lead = p.count;

  /**
   * A bubble, from the point of it at `from` degrees, turning `dir`: once
   * round, a highlight curling in off its upper left and back out, and on
   * round to `exit`.
   */
  const bubble = (b: Bubble, from: number, exit: number, dir: 1 | -1) => {
    const [cx, cy] = b;
    const glint = 230;
    p.arc(cx, cy, 360 * dir).arc(cx, cy, turn(from, glint, dir));
    const curl = p.count;
    const spiral: Pt[] = [];
    for (let k = 1; k <= 5; k++) spiral.push(at(b, glint + dir * k * 9, 1 - 0.07 * k));
    p.through(spiral);
    p.retrace(curl);
    p.arc(cx, cy, turn(glint, exit, dir)).corner();
  };
  /** a tiny bubble about (cx, cy), from its top (where the pen is): once round and out of its bottom */
  const dot = (cx: number, cy: number) => p.arc(cx, cy, -540).corner();

  bubble(BIG, -90, 150, -1);
  // out to the left: past a tiny bubble to the left one, past another to the smallest
  const out = p.count;
  p.through([[248, 176], [232, 190]], [-0.6, 1]);
  dot(232, 196);
  p.through([[216, 212], at(LEFT, -90)], [-1, 0]);
  bubble(LEFT, -90, 70, -1);
  p.through([[218, 316], [222, 324]], [0.2, 1]);
  dot(222, 330);
  p.through([[226, 352], at(SMALL, -90)], [1, 0]);
  bubble(SMALL, -90, 270, 1);
  // ...and back exactly over all of it to the big bubble
  p.retrace(out);
  // along its underside to the left stream, down into the arrow
  p.corner().arc(BIG[0], BIG[1], turn(150, 105, -1));
  p.corner().through([[316, 300]], [0, 1]);
  // round the arrow: down the shaft, out to the head, the tip, back in, up the shaft
  p.corner().rounded([[316, 440], [288, 440], [330, 516], [372, 440], [344, 440], [344, 300]], 3);
  // up the right stream to the bubble, along it, and out past a tiny bubble to the right-hand one
  p.corner().through([at(BIG, 75)], [0.1, -1]);
  p.corner().arc(BIG[0], BIG[1], turn(75, 20, -1));
  p.corner().through([[416, 172], [428, 184]], [0.4, 1]);
  dot(428, 190);
  p.through([[436, 230], at(RIGHT, -90)], [1, 0]);
  bubble(RIGHT, -90, 60, 1);
  // and straight down to the bottom edge
  p.line(at(RIGHT, 60)[0], 620);
  return { d: p.d, lead };
}

const METHANE = methaneBubbles();

/**
 * Carbon value, in order along one ground line: reductions first, value
 * follows. Straight in from the top-right and down the axis of a chart whose
 * bars fall, with a trend arrow pointing down across them (out from the axis
 * and back); along the ground to a credit certificate: up the ribbon tails to
 * its rosette, round it and down, round the certificate (its corner folded,
 * two lines of text), and back over it to the ground; on to a stack of coins,
 * up its side, round the top coin with a seedling growing out of it, down the
 * coins, and away. Everything drawn twice is drawn exactly over itself, so
 * the picture stays one line.
 */
function reductionsToValue() {
  const G = 560;
  const p = new Pen(600, 0, [0, 1]);
  // in along the top and down to the chart's axis
  p.rounded([[600, 48], [40, 48], [40, 230]], 24);
  const lead = p.count;

  // reductions: down the axis, a trend arrow falling across the bars (out and back), on down
  p.line(40, 262).corner();
  const trend = p.count;
  const end: [number, number] = [218, 430];
  const len = Math.hypot(end[0] - 40, end[1] - 262);
  const [ux, uy] = [(end[0] - 40) / len, (end[1] - 262) / len];
  const barb = (deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180;
    return [end[0] - 24 * (ux * Math.cos(a) - uy * Math.sin(a)), end[1] - 24 * (ux * Math.sin(a) + uy * Math.cos(a))];
  };
  p.line(...end).corner().line(...barb(30)).corner().line(...end).corner().line(...barb(-30)).corner().line(...end);
  p.retrace(trend);
  p.corner().line(40, G).corner();
  // three bars, each lower than the last
  p.rounded([[62, G], [62, 330], [96, 330], [96, G], [114, G], [114, 400], [148, 400], [148, G], [166, G], [166, 470], [200, 470], [200, G], [290, G]], 3).corner();

  // the credit: up the left ribbon tail to the rosette, round its scalloped edge, down the right tail
  const [sx, sy, sr] = [316, 480, 32];
  p.line(sx, sy + sr).corner();
  const scallop: Pt[] = [];
  for (let k = 1; k <= 18; k++) {
    const a = ((90 + k * 20) * Math.PI) / 180;
    const r = k % 2 ? sr - 5 : sr;
    scallop.push([sx + r * Math.cos(a), sy + r * Math.sin(a)]);
  }
  p.through(scallop).corner();
  p.line(342, G).corner().line(386, G).corner();
  // round the certificate: up its right side, the folded corner, along the top, down the left side past two lines of text
  const sheet = p.count;
  p.line(386, 314).corner().line(362, 290).corner();
  const fold = p.count;
  p.line(362, 314).corner().line(386, 314);
  p.retrace(fold);
  p.corner().line(246, 290).corner().line(246, 330).corner();
  const line1 = p.count;
  p.line(340, 330);
  p.retrace(line1);
  p.corner().line(246, 362).corner();
  const line2 = p.count;
  p.line(312, 362);
  p.retrace(line2);
  p.corner().line(246, G);
  // ...and back over all of it to the ground on its right
  p.retrace(sheet);

  // value: along to the coins, up the side of the stack to the top coin
  p.corner().line(430, G).corner().line(430, 536).corner().line(430, 512).corner().line(430, 488);
  const [cx, cy, rx, ry] = [490, 488, 60, 14];
  const rim = (deg: number): Pt => [cx + rx * Math.cos((deg * Math.PI) / 180), cy + ry * Math.sin((deg * Math.PI) / 180)];
  // over the far edge of the top coin's face to its top
  p.through([rim(200), rim(225), rim(250), rim(270)]);
  // the seedling: up the stem, a leaf to the left, on up, a leaf to the right, and back down the stem
  const stem = p.count;
  p.corner().line(cx, 420).corner();
  p.through([[472, 402], [440, 392, 1]]).through([[458, 416], [cx, 420, 1]]).corner();
  p.line(cx, 388).corner();
  p.through([[510, 368], [544, 360, 1]]).through([[524, 384], [cx, 388, 1]]).corner();
  p.retrace(stem);
  // the rest of the face, round to where it started
  p.corner().through([rim(290), rim(315), rim(340), rim(360), rim(20), rim(45), rim(70), rim(90), rim(110), rim(135), rim(160), rim(180)]);
  // the coins below: down the side, across the front of each (curving with it), and down
  p.corner().line(430, 512);
  p.corner().through([[cx, 512 + ry], [550, 512, 1]]);
  p.corner().line(550, 488).corner().line(550, 512).corner().line(550, 536).corner();
  p.through([[cx, 536 + ry], [430, 536, 1]]);
  p.retrace(p.count - 2);
  p.corner().line(550, G).corner();
  // the foot of the bottom coin, there and back
  p.line(430, G);
  p.retrace(p.count - 1);
  // and away
  p.line(576, G).corner().line(576, 620);
  return { d: p.d, lead };
}

export const SCENES = {
  // hero: drawn by the pointer or the first quarter-screen of scroll
  cow: {
    w: 1370,
    h: 856,
    d: cowAndCalf(),
  },
  // CH4OW: CH4 bubbles sent back down into the board, "CH4 LESS"
  methane: {
    w: 640,
    h: 620,
    labels: [
      { x: 330, y: 143, text: "CH₄", size: 38, at: 0.15, weight: 500 },
      { x: 196, y: 270, text: "CH₄", size: 24, at: 0.28, weight: 500 },
      { x: 232, y: 398, text: "CH₄", size: 16, at: 0.38, weight: 500 },
      { x: 462, y: 297, text: "CH₄", size: 20, at: 0.94, weight: 500 },
      { x: 556, y: 430, text: "CH₄", size: 52, at: 0.75, weight: 500 },
      { x: 549, y: 451, text: "▼", size: 20, at: 0.78, weight: 500 },
      { x: 553, y: 484, text: "LESS", size: 26, at: 0.82, weight: 500, deco: "underline" },
    ],
    lead: METHANE.lead,
    d: METHANE.d,
  },
  // feed and TMR: fodder grass, a tractor hauling fodder, a bowl of TMR
  feed: {
    w: 640,
    h: 520,
    ...feedToBowl(),
  },
  // green energy: cow, manure, biogas plant and CBG, fertiliser, fodder fields
  energy: {
    w: 640,
    h: 540,
    ...manureToFields(),
  },
  // the corridor: cow, feed, tractor, milk, biogas and data on one route
  corridor: {
    w: 640,
    h: 600,
    ...corridorRoute(),
  },
  // gramCarbon: trace, measure, verify
  gramcarbon: {
    w: 600,
    h: 540,
    ...traceMeasureVerify(),
  },
  // carbon value: reductions, a credit certificate, coins with a seedling growing out of them
  offsets: {
    w: 600,
    h: 620,
    ...reductionsToValue(),
  },
  // partners: the line writes the zeroearth wordmark, then hands over to the logo
  finale: {
    w: 900,
    h: 360,
    // the wordmark image that takes over from the drawn line: x, y, width, height
    logo: [20, 104, 860, 150.9],
    d: WORDMARK,
  },
} satisfies Record<string, InkScene>;

export type SceneName = keyof typeof SCENES;
