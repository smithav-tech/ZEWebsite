import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mediaVersions } from "./scripts/media-versions.mjs";

/**
 * The bundle in parts that change at different rates, so a deploy that only
 * touches the site's own code leaves React, GSAP and the doodle paths cached,
 * and the parts download side by side (Vite preloads them all).
 */
function chunk(id: string) {
  if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
  if (id.includes("node_modules/gsap/")) return "gsap";
  // the traced doodles: large path strings that change only when a drawing is re-traced
  if (/src\/client\/ink\/(traced|drawn)\.ts$/.test(id)) return "doodles";
}

export default defineConfig({
  plugins: [react()],
  // every image URL carries its file's hash (content.ts), so a replaced photo is never shown from a cache
  define: { __MEDIA_VERSIONS__: JSON.stringify(mediaVersions()) },
  server: { port: 5180 },
  build: {
    rollupOptions: {
      output: { manualChunks: chunk },
    },
  },
});
