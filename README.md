# ZeroEarth website

Decarbonising dairy: CH4OW, feed and TMR, green energy, the clean low-carbon milk corridor and gramCarbon.

Vite, React and TypeScript, with GSAP for the loader. The page has one continuous drawn line that follows the scroll, and a WebGL milk background.

## Run locally

```sh
pnpm install
pnpm dev        # http://localhost:5180
```

## Build

```sh
pnpm build      # static site in dist/
```

`dist/` is plain static files. Serve it from any web server, for example nginx with its root set to the `dist` folder.

## Layout

| Path | What |
| --- | --- |
| `src/client/ClientSite.tsx` | The page, section by section |
| `src/client/content.ts` | Team, advisors, projects, partners and contact details |
| `src/client/sections/` | One component per section |
| `src/client/ink/` | The drawn line and its doodles |
| `src/client/milk/` | The milk background |
| `src/client/Loader.tsx` | The loading screen |
| `src/client/client.css` | Site styles |
| `public/media/client/` | Images and fonts |

The previous static site is kept on the `v1` branch.
