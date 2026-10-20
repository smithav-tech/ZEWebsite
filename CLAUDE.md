# ZeroEarth website

The ZeroEarth marketing site (decarbonising dairy: CH₄OW, feed and TMR, green energy, the low-carbon milk corridor, gramCarbon). It's a single page built with Vite, React 19 and TypeScript. One continuous hand-drawn ink line runs down the page and draws a doodle in each chapter, over a WebGL "milk" background. There are also `/team` and `/projects` pages.

## Commands

```sh
pnpm install
pnpm dev                          # http://localhost:5180 (the preview config is "site" in .claude/launch.json)
pnpm build                        # tsc -b, then vite build into dist/ (static files)
python scripts/build_traced.py    # re-trace design/doodles/*.png into src/client/ink/traced.ts
python scripts/check_traced.py    # check that every doodle matches its source image (see below)
```

There are no unit tests. Check changes with `pnpm build` (for types) and in the browser preview.

## Layout

| Path | What |
| --- | --- |
| `src/App.tsx` | Picks the page (home, `/team`, `/projects`) and runs the loader once per session |
| `src/client/router.ts` | A small history-API router with no library |
| `src/client/ClientSite.tsx` | The home page, section by section, in order |
| `src/client/sections/` | One component per section. `Scene.tsx` is the shared chapter layout (copy plus doodle) |
| `src/client/content.ts` | Team, advisors, projects, partners and contact details. Edit copy data here |
| `src/client/ink/InkLine.tsx` | The page-long line: layout, links between drawings, and the draw-on animation |
| `src/client/ink/route.ts`, `stitch.ts` | How the links route around copy and headlines, and how the hero title joins the cow |
| `src/client/ink/scenes.ts` | The drawings in page order, plus labels (CH₄, LESS) and the finale logo hand-over |
| `src/client/ink/traced.ts` | **Generated** paths for the chapter doodles. Never edit it by hand |
| `src/client/ink/drawn.ts` | The finale's zeroearth wordmark (drawn by hand, not traced) |
| `src/client/ink/Doodle.tsx` | The empty `.doodle-box` that InkLine draws into |
| `src/client/milk/` | The WebGL milk background (shaders) |
| `src/client/Loader.tsx`, `loader.css` | The loading screen (GSAP) |
| `src/client/client.css` | Site styles. `team.css` and `fx/` hold page and effect styles |
| `design/doodles/` | The approved source images for the doodles (1–7, made in Gemini) |
| `scripts/` | The doodle tracer (`trace_doodle.py`), the build (`build_traced.py`) and the check (`check_traced.py`) |
| `public/media/client/` | Images and fonts served by the site. `assets-originals/` holds the full-size originals |

## Doodles: draw them, animate them, match the image

Every chapter doodle follows these rules.

1. **It is drawn and animated.** The ink line draws each doodle on screen as one continuous stroke (stroke-dashoffset in `InkLine.tsx`). It plays through over `PLAY` (2.4s) once its section comes into view, and the hero draws itself over `SELF_DRAW`. Never show a doodle as a static `<img>` or inline SVG, and never fade it in instead of drawing it. Reduced motion is the only exception: then everything is shown fully drawn at once.
2. **It is the exact image.** The path has to be the drawing in its approved source image in `design/doodles/`, traced by `scripts/build_traced.py`. Don't hand-draw, simplify, restyle or approximate a doodle in SVG. Don't edit the numbers in `traced.ts`. To change a drawing, change the image, or change its `SCENES` entry in `build_traced.py` (crop, entry and exit sides, tracer options), then re-run the build.
3. **Check it against the image.** After any change to an image, a crop, the tracer or `traced.ts`, run `python scripts/check_traced.py [out_dir]` and look at the overlays it writes. In each overlay, grey is the image, blue is the path, red is ink the path misses and orange is path where the image has no ink. Every scene must report `sync yes`, cover ≥ 98% and stray ≤ 3%, and the script exits 1 if any scene doesn't. If a scene fails, fix the trace (for fine detail use the `FINE` options: higher `--work`, lower `--eps` and `--smooth`). Don't lower the limits.
4. **The box takes the drawing's shape.** A chapter's box uses the drawing's own `w / h` (`Scene` sets `--ar`). The hero's ratio is hard-coded in `client.css` (`.hero-art { aspect-ratio: 1024 / 620 }`, plus `margin-top: calc(var(--hero-art-w) * -0.3027)`, which is half the height over the width). Update both if the hero's `w` or `h` changes.
5. **New images come from the user.** Claude can't make raster images. Use the `image-request` skill (`.claude/skills/image-request/`) to write the Gemini prompt and wait for the file. Doodle images are a single unbroken black line on white or transparent, with no fills, shading or colour. They enter from the left and leave at the bottom. Gemini's download button sometimes saves the wrong image, and transparent PNGs need compositing on white before you judge them.

## Ink line constraints

- InkLine measures the page only at load, resize and font load, never on scroll. It reads `.doodle-box` rects, the headline glyphs (`.hero-title, .display`) and copy "obstacles" (p, li, h3, `.btn` and so on in `main`). From the Hero through the last scene (CarbonValue, `#offsets`), don't put resting or entrance transforms on any of those, or the line misaligns. Use paint-only effects (shadow, filter) on headlines and hover-time transforms only on copy. Sections after the last scene (Team, Projects, Partners, footer) are free for transforms.
- Layering: `.ink--back` (z 0, the line and doodles) sits behind `main` (z 1), so an opaque background in `main` hides the line. Decoration meant to sit under the drawings goes in a layer inside `.page` before `<InkLine />`.
- Every drawing except the finale enters from its left edge and every scene except the last leaves through its bottom edge. The links in `route.ts` depend on this. Labels must sit clear of the line at every size.

## Layout and design

- Desktop (> 860px): each scene is two columns that never overlap, with copy in column 1 and the drawing in column 2, both vertically centred on one grid row, so the chapter is only as tall as the taller of the two. If they clash, reflow or shrink the text, not the drawing. Keep the page rhythm tight, with no dead space between copy and drawings.
- Judge spacing at a real viewport such as 1440×900, never in a very tall headless window. The hero and `.scene-art` use `vh` units, so a tall window inflates every gap.
- UI changes are mocked and approved on the Claude Design canvas first (https://claude.ai/artifact/WiwzxR64FqFo97yJWrTnbH), then mirrored in code. The canvas's mobile board fell behind, so the responsive CSS in code is the reference for phone layouts.
- Style: Title Case headlines, flat buttons (`.btn`, `.btn-cta` with a lime icon circle), and a nav that is flat at the top and turns to glass on scroll.
- People and project photos are real and are never generated. Ask for the real photo.
- The contact email `info@zeroearth.company` was inferred from a truncated comment and hasn't been confirmed.

## Workflow

- Split larger, multi-file work across subagents with one area of files each, and run the simpler pieces on Sonnet. Give every agent the ink line constraints above.
