"""Check that every doodle on the site is the drawing in its source image.

usage: python scripts/check_traced.py [out_dir] [--only key,key]

For each SCENES entry in build_traced.py this lays the path in
src/client/ink/traced.ts back over its image in design/doodles/ and reports:
- sync: traced.ts is exactly what build_traced.py makes from the image today
  (if not, an image or a crop changed and the build was not re-run);
- cover: the share of the image's ink (its centreline, inside the scene's crop)
  that the path passes within TOL px of: below 1, part of the drawing is missing;
- stray: the share of the path that runs further than TOL px from any ink:
  above 0, the path draws something that is not in the image (bridges across
  gaps, smoothing that cuts corners).
It writes one overlay per scene to out_dir: grey is the image, blue the path,
red the ink the path misses, orange the path where the image has no ink.
Exits 1 when any scene is out of sync or outside the limits below.
"""
import os
import re
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from build_traced import SCENES, parse, trace  # noqa: E402
from trace_doodle import components, load, zhang_suen  # noqa: E402

TOL = 3  # px at 1024 wide: about a pen width either side of the centreline
MIN_COVER = 0.98
MAX_STRAY = 0.03


def traced_ts():
    src = open(os.path.join(ROOT, "src", "client", "ink", "traced.ts"), encoding="utf-8").read()
    return {m[1]: m[2] for m in re.finditer(r'export const (\w+) = \{ w: \d+, h: \d+, d: "([^"]+)" \}', src)}


def render(d, ox, oy, size):
    """the path, 1px wide, shifted by (ox, oy) into an image of `size`"""
    im = Image.new("L", size, 0)
    dr = ImageDraw.Draw(im)
    (x, y), segs = parse(d)
    for c in segs:
        t = np.linspace(0, 1, 24)[:, None]
        p0, p1, p2, p3 = np.array([x, y]), np.array(c[0:2]), np.array(c[2:4]), np.array(c[4:6])
        pts = (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t**2 * p2 + t**3 * p3
        dr.line([(px + ox, py + oy) for px, py in pts], fill=255, width=1)
        x, y = c[4], c[5]
    return np.asarray(im) > 0


def near(mask, r):
    """every pixel within r of the mask (a square neighbourhood)"""
    im = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(2 * r + 1))
    return np.asarray(im) > 0


def check(scene, ts, out, tmp):
    key, const, image, entry, exit_, crop, *_ = scene
    j, (d_now, w, h) = trace(scene, tmp)
    d = ts.get(const)
    sync = d == d_now
    if d is None:
        d = d_now

    # the image's ink as the tracer sees it, specks dropped, thinned to a centreline
    g = load(os.path.join(ROOT, "design", "doodles", image + ".png"))
    ink = g < 150
    comps = components(ink)
    big = max(len(c) for c in comps)
    keep = np.zeros_like(ink)
    for c in comps:
        if len(c) >= max(60, big * 0.004):
            ys, xs = zip(*c)
            keep[list(ys), list(xs)] = True
    centre = zhang_suen(keep.astype(np.uint8)) > 0

    # the scene's box in the image
    ox, oy = j["origin"][0] + crop[0], j["origin"][1] + crop[1]
    x0, y0 = round(ox), round(oy)
    x1, y1 = min(g.shape[1], x0 + w), min(g.shape[0], y0 + h)
    path = render(d, ox, oy, (g.shape[1], g.shape[0]))
    box = np.zeros_like(ink)
    box[y0:y1, x0:x1] = True

    centre &= box
    missed = centre & ~near(path, TOL)
    stray = path & ~near(keep, TOL)
    cover = 1 - missed.sum() / max(1, centre.sum())
    stray_share = stray.sum() / max(1, path.sum())

    S = 2
    rgb = np.full(g.shape + (3,), 255, np.uint8)
    rgb[keep] = (205, 205, 205)
    rgb[near(path, 1)] = (40, 90, 220)
    rgb[near(missed, 2)] = (230, 30, 30)
    rgb[near(stray, 1)] = (255, 150, 0)
    im = Image.fromarray(rgb[y0:y1, x0:x1])
    im = im.resize((im.width * S, im.height * S), Image.NEAREST)
    im.save(os.path.join(out, f"{key}.png"))

    ok = sync and cover >= MIN_COVER and stray_share <= MAX_STRAY
    return ok, sync, cover, stray_share


def main():
    args = sys.argv[1:]
    only = None
    if "--only" in args:
        i = args.index("--only")
        only = set(args[i + 1].split(","))
        del args[i : i + 2]
    out = args[0] if args else tempfile.mkdtemp(prefix="doodle-check-")
    os.makedirs(out, exist_ok=True)
    tmp = tempfile.mkdtemp()
    ts = traced_ts()
    bad = 0
    print(f"{'scene':<11} {'sync':<5} {'cover':>6} {'stray':>6}")
    for scene in SCENES:
        if only and scene[0] not in only:
            continue
        ok, sync, cover, stray = check(scene, ts, out, tmp)
        bad += not ok
        flag = "" if ok else "  <-- off the image"
        print(f"{scene[0]:<11} {'yes' if sync else 'NO':<5} {cover:6.1%} {stray:6.1%}{flag}")
    print(f"limits: cover >= {MIN_COVER:.0%}, stray <= {MAX_STRAY:.0%}, within {TOL}px at 1024 wide")
    print("overlays in", out)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
