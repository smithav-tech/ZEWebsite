// A short content hash for every file under public/media/client, keyed by its
// path there ("team/smitha-v.webp"). vite.config.ts hands the map to the site,
// which puts the hash on each image URL: a replaced photo gets a new URL, so
// browsers fetch it again instead of showing the copy they kept (Safari on an
// iPhone keeps images through a reload), while unchanged files stay cached.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

const ROOT = new URL("../public/media/client/", import.meta.url);

export function mediaVersions() {
  const versions = {};
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = prefix + entry.name;
      if (entry.isDirectory()) walk(new URL(`${entry.name}/`, dir), `${path}/`);
      else versions[path] = createHash("sha1").update(readFileSync(new URL(entry.name, dir))).digest("hex").slice(0, 8);
    }
  };
  walk(ROOT, "");
  return versions;
}
