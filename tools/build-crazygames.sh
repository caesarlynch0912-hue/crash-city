#!/usr/bin/env bash
# Builds dist/crash-city-crazygames.zip for upload to the CrazyGames developer portal.
# The zip has index.html plus three.js and the fonts as local files (relative paths, no CDN).
# Pricedown is left out on purpose: its free licence does not allow embedding it in a game,
# so the CrazyGames build uses Bungee (OFL) for headings.
# Usage, from the repo root: bash tools/build-crazygames.sh
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=dist/crazygames CACHE=dist/.cache
rm -rf "$OUT" && mkdir -p "$OUT/lib" "$OUT/fonts" "$CACHE"

get(){ # get <url> <cache name>
  [ -s "$CACHE/$2" ] || curl -fsSL "$1" -o "$CACHE/$2"; }

T=https://cdn.jsdelivr.net/npm/three@0.128.0
get https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js three.min.js
for f in shaders/CopyShader shaders/LuminosityHighPassShader postprocessing/EffectComposer postprocessing/ShaderPass \
         postprocessing/RenderPass postprocessing/UnrealBloomPass utils/BufferGeometryUtils; do
  get "$T/examples/js/$f.js" "$(basename $f).js"; done
cp "$CACHE"/*.js "$OUT/lib/"

F=https://cdn.jsdelivr.net/npm/@fontsource
get "$F/bungee@5.0.8/files/bungee-latin-400-normal.woff2" bungee-400.woff2
get "$F/chakra-petch@5.0.8/files/chakra-petch-latin-500-normal.woff2" chakra-petch-500.woff2
get "$F/chakra-petch@5.0.8/files/chakra-petch-latin-700-normal.woff2" chakra-petch-700.woff2
cp "$CACHE"/*.woff2 "$OUT/fonts/"
cat > "$OUT/fonts/fonts.css" <<'CSS'
@font-face{font-family:"Bungee";font-weight:400;font-display:swap;src:url(bungee-400.woff2) format("woff2")}
@font-face{font-family:"Chakra Petch";font-weight:500;font-display:swap;src:url(chakra-petch-500.woff2) format("woff2")}
@font-face{font-family:"Chakra Petch";font-weight:700;font-display:swap;src:url(chakra-petch-700.woff2) format("woff2")}
CSS

# Same game, with every external URL swapped for a local file and Pricedown dropped from the font stack.
sed -e '/fonts.googleapis.com\|fonts.gstatic.com\|fonts.cdnfonts.com/d' \
    -e 's|<meta name="viewport"[^>]*>|&\n<link rel="stylesheet" href="fonts/fonts.css">|' \
    -e 's|https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js|lib/three.min.js|' \
    -e 's|https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/[a-z]*/\([A-Za-z]*\.js\)|lib/\1|' \
    -e 's|--display:"Pricedown Bl", "Pricedown", |--display:|' \
    index.html > "$OUT/index.html"

if grep -n 'https\?://' "$OUT/index.html" | grep -v 'www.w3.org'; then echo "external URL left in the build" >&2; exit 1; fi
rm -f dist/crash-city-crazygames.zip
# Python's zipfile writes forward-slash paths (Windows Compress-Archive writes backslashes, which break on Linux servers).
python -I - "$OUT" dist/crash-city-crazygames.zip <<'PY'
import os,sys,zipfile
src,dst=sys.argv[1],sys.argv[2]
with zipfile.ZipFile(dst,'w',zipfile.ZIP_DEFLATED) as z:
    for root,_,files in os.walk(src):
        for f in sorted(files):
            p=os.path.join(root,f);z.write(p,os.path.relpath(p,src).replace(os.sep,'/'))
PY
ls -la dist/crash-city-crazygames.zip
