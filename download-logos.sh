#!/usr/bin/env bash
# Downloads partner logos into ./downloaded-assets
# Usage: bash download-logos.sh
set -u
OUT="downloaded-assets"
mkdir -p "$OUT"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
# Wikimedia rate-limits browser-like agents; it asks for a descriptive one
WIKI_UA="ZeroEarthWebsiteLogoFetch/1.0 (curl)"

fetch() { # fetch <output-file> <url> [user-agent]
  if curl -fsSL -A "${3:-$UA}" --retry 3 --retry-delay 5 -o "$OUT/$1" "$2"; then
    echo "OK    $1"
  else
    echo "FAIL  $1  <- $2"; rm -f "$OUT/$1"
  fi
}

# 1. AFC India (from site header)
fetch afc-india.png              "https://www.afcindia.org.in/logo/afc-logo-new.png"
# 2. Agrinnovate India (from site header)
fetch agrinnovate-india.png      "https://agrinnovateindia.com/templates/agrinnovate-india/assets/images/logo.png"
# 3. BIRAC (official logo download page)
fetch birac.jpg                  "https://birac.nic.in/webcontent/Logo.jpg"
# 4. CGIAR (Wikimedia Commons)
fetch cgiar.svg                  "https://commons.wikimedia.org/wiki/Special:FilePath/CGIAR-logo.svg" "$WIKI_UA"
# 5. Gates Foundation (Wikimedia Commons)
sleep 3
fetch gates-foundation.svg       "https://commons.wikimedia.org/wiki/Special:FilePath/Gates_Foundation_logo.svg" "$WIKI_UA"
# 6. Grand Challenges India (grandchallengesindia.org no longer resolves; logo from grandchallenges.org partners)
fetch grand-challenges-india.png "https://www.grandchallenges.org/sites/default/files/images/gci-logo_544x186.png"
# 7. ICAR (icar.gov.in has an expired TLS cert; same file linked on icar.org.in)
fetch icar.png                   "https://icar.org.in/sites/default/files/2025-07/icarlogo.png"
# 8. Kerala Startup Mission (Wikimedia Commons + official branding page)
sleep 3
fetch kerala-startup-mission.svg "https://commons.wikimedia.org/wiki/Special:FilePath/KSUM-logo.svg" "$WIKI_UA"
fetch kerala-startup-mission.png "https://innovate.startupmission.in/assets/im/ksum.png"
# 9. NAARM a-IDEA (from site header)
fetch naarm-aidea.png            "https://aidea.naarm.org.in/storage/logo/aidea-logo.png"
# 10. T-Hub (header logo on t-hub.co; an SVG wrapping a 547x456 PNG)
fetch t-hub.svg                  "https://cdn.prod.website-files.com/69130479501764fda8a895c6/6927dc95d9efce33b45f7305_image%201.svg"
