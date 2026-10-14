# Handoff: Crash City (formerly "Harbor Heat")

Current version: **1.4**. Everything below is what a new agent needs to continue without re-reading the old conversation.

## 1. The user and how to work with them

- Swedish teenager/student, writes short casual Swedish ("bror", "fixa", typos). **Reply in Swedish.** Keep explanations plain; they care about results, not internals.
- Works on a **school laptop** (Windows 11 Education, user `ad87546`, AMD Ryzen 3 7335U with integrated GPU, 16 GB RAM). Performance matters: this machine is weak.
- **School network DNS (`edudns1.stockholm.se`) cannot resolve `*.frame.claudeusercontent.com`**, so the claude.ai artifact link does not load for them at school. Always also deliver a standalone `.html` file via SendUserFile. cdnjs, jsdelivr and fonts.cdnfonts.com ARE reachable.
- They play in the standalone file or in the app's Browser pane (localhost preview). Their saves live in that origin's localStorage (best score ~13 934, many cars owned, wallet ~272 coins).
- Request history, in order: copy a GTA browser game (refused: copyright; built an original instead) → 2D top-down game → 3D → better graphics → survival chase instead of missions → sound/engine/garage/solid buildings → weapons + "fun stuff" → bigger map, biomes, slower/realistic cars → cleaner menus → easier unlocks, more cars, more power-ups → character fix, skins menu, car-jack animation, challenges → a game-feel design doc was implemented and then **reverted on request** ("ta bort allt från senaste prompten", that state was named 1.1) → rename to Crash City + Pricedown font → English version, power-up text must not block the view, coins instead of cash, coin counter, bug hunt with 10k–50k test runs → clean HUD, more/shinier coins, language picker (7 languages) shown at startup, better character, lower top speed on best cars, more police from more directions, Shift nitro → **blocky (not rounded) characters + fix lag** (1.4, done).
- The user has not asked to commit or publish code anywhere except this handoff request.

## 2. Files in this folder

| Path | What it is |
|---|---|
| `harbor-heat.html` | **The single source of truth.** One HTML file, no build system. Starts at `<title>` (no doctype/html/head/body: the Artifact publisher wraps it). |
| `harbor-heat-app/index.html` | Wrapped copy (doctype/head/body added) served by the local preview server. Regenerate after every edit (command below). |
| `Crash-City-v1.4.html` | Latest standalone deliverable (same as `harbor-heat-app/index.html`). Older: `Crash-City-v1.1.html`, `Crash-City-v1.3.html`. |
| `.claude/launch.json` | Preview server config `harbor-heat` (node one-liner on port 5177 serving `harbor-heat-app/index.html`). Start with `preview_start name=harbor-heat`. |
| `tools/fuzz.js` | Parallel fuzz tester (worker_threads). `node tools/fuzz.js harbor-heat.html <perWorker> <workers>`. ~13 scenarios/s per 7 workers. |
| `tools/sim2.js` | Wall-collision + ram test + garage unlock test. |
| `tools/sim4.js` | 10-min combat simulation (all weapons, ramps, heli, military). |
| `tools/sim9.js` | Car-jack phase test + challenge completion test. |
| `tools/i18ncheck.js` + `tools/dict.js` | Checks every `tr()/trf()` key and visible Swedish text has all 6 translations and placeholders survive. `dict.js` is the editable dictionary (also embedded in the HTML as `const DICT=`). |
| `tools/removed-game-feel-version.html` | The reverted "game feel" version (slip/drift model, combo bank, skid marks, speed lines, medals, settings sliders, 28 unit tests). Kept only in case the user wants pieces back. |

Wrap command (run from this folder after editing the source):
```bash
{ printf '<!doctype html>\n<html lang="sv">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'; sed -n '1,/<\/style>/p' harbor-heat.html; printf '</head>\n<body>\n'; sed -n '/<\/style>/,$p' harbor-heat.html | sed '1d'; printf '\n</body>\n</html>\n'; } > harbor-heat-app/index.html && cp harbor-heat-app/index.html Crash-City-vX.Y.html
```

**Windows pitfall (bit us twice):** the filesystem is case-insensitive. `Harbor-Heat.html` and `harbor-heat.html` are the SAME file. Never name a deliverable anything that matches the source case-insensitively, and never `rm` such a name.

Artifact: `https://claude.ai/artifact/2pisP4drM5uE4tbPeuurF2` (publish `harbor-heat.html`, same path keeps the URL). The CSP blocks the Pricedown stylesheet there, so the artifact falls back to Bungee.

## 3. Architecture of `harbor-heat.html`

Plain JS + three.js r128 (UMD from cdnjs) + jsdelivr `three@0.128.0/examples/js/` (CopyShader, LuminosityHighPassShader, EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, BufferGeometryUtils). Fonts: Google Fonts (Bungee, Chakra Petch) + `fonts.cdnfonts.com/css/pricedown` (`--display` = Pricedown, `--small` = Bungee for small HUD labels).

Script order (important: everything before the `/* ================= 3D` marker is pure logic with no THREE, which is what the Node test harnesses slice and run):

1. **i18n core** at the top: `LANGS`, `LANG` (localStorage `hh-lang`), `DICT` (Swedish key → `[en,de,fr,es,da,no]`), `PLACES`, `tr(s)`, `trf(s,{vars})`, `LOCALE()`. **The game already uses a global `T` for time, so translation is `tr`/`trf`, never `T`/`F`.** Swedish strings in code are the keys.
2. **City data**: 14×14 grid, `CELL=480, ROAD=120, WORLD=6840`. Biomes via `biomeOf()` (downtown, suburb, park, harbor, forest, farm, beach). Every solid thing is a rect in `block.bld` (`type`: tower, house, warehouse, cont, barn, silo, bale, hut, lifeguard, fountain, water, tree, leg). `solid()`, `isRoad()`, `freeCircle()` (checks centre + 8 points), `curbPoint()`, `roadPoint()`.
3. **Entities**: `cars`, `peds`, `coins` (trails of 5–8 along roads, 30 trails), `parts`. `player` has `nitro/nitroOn/nitroWait`, `jack` (car-jack state), `car`.
4. Input, game state, power-ups (`POWER`, 17 + `KEYDEF` golden key, tiers at 0/600/1800/4000 pts), `fx` timers.
5. Driving physics `drive()` (power-limited acceleration, sub-stepped movement, wall sliding, `unstick()`), civ AI on lanes, cop/army AI `updateCop()` (chases decoy, slow-mo, freeze). `spawnEnemy()` spawns 40% ahead, 30% from the sides, else anywhere. Wanted levels: cops `[0,3,4,6,8,10]`, military after 140 s (6 cops + up to 10 army).
6. Collisions, peds, `updateWorld()` (score, escalation, coins, bust/wasted).
7. Garage (`CAR_SPECS`, 15 cars, unlocked by score, golden key, or bought with coins: `carPrice = req/20` rounded to 5).
8. Combat (5 weapons, tracers, rockets, mines, barrels, heli, ramps, airtime, near-miss, drift, combos), challenges (`CHAL_DEFS`, 3 active), skins (`SKINS`, 8, unlocked by total challenges `stats.chal`), car-jacking (`enterCar` → walk/pull/enter → `takeCar`).
9. `endRun`, `showOver`, `resetRun`, `tick()` (fixed 60 Hz).
10. **3D**: renderer, quality tiers (`QUAL`, `applyQuality`, `autoQuality`, setting `hh-gfx` auto/high/low), bloom composer, sky/env, static world batched per material+chunk (`addStatic`/`flushStatic`, non-indexed merge), buildings, cars (`buildCar`, door pivot, LOD hides details beyond 520), people (`buildPed`, `buildHero` both **blocky boxes**, `poseHero`/`animPed`), instanced coins and barrels, power-up/combat visuals.
11. Minimap, HUD (`renderHud`), notices (`notify()`; big `toast(...,true)` only for KÖR/BUSTED/WASTED), audio (all synthesized WebAudio, radio sequencer), garage/skins/settings/language screens, menu system (`SCREENS`, `showScreen`, `backScreen`, pause), frame loop (`acc` capped at 4 ticks).

localStorage keys: `hh-lang, hh-best, hh-garage, hh-coins, hh-stats, hh-skin, hh-mute, hh-radio, hh-gfx`.

## 4. Testing status

- Fuzz totals across sessions: 21 000 + 2 100 + 10 500 + 2 100 scenarios (~10 M ticks). Last two runs: **0 failures**. Bugs it found and that are fixed: player pushed into walls by cars, player exiting into a 6×6 tree (fixed by checking the centre in `freeCircle` + `unstickPlayer()` on exit), particle overshoot (hard cap 700 at end of tick).
- Perf in the 1046×682 preview window: one frame 5.5 ms (was 9 ms), 2 396 objects (was 3 947), 2 lights (was 8). Not yet measured on the user's real full-screen machine.
- `tools/i18ncheck.js` reports 4 "missing" that are intentional (JS-overwritten placeholders and the multilingual eyebrow on the language screen).
- The Browser pane often throttles rAF when hidden; use JS to call `renderHud()/renderSkinPreview()` before screenshots, and expect very low FPS there.

## 5. Open items / likely next asks

- Ask the user whether 1.4 still stutters on their machine; if yes, next levers: fewer visible peds/cars, cheaper buildings, `Grafik: Låg` default, smaller lamp pools, InstancedMesh for peds.
- `stats.chal` may show 30 because of an earlier test that may not have been fully restored. Offer to reset if the user says it is wrong.
- The Electron `.exe` idea from early on is paused (they said "skapa inte den än").
- Pricedown could be inlined as a data-URI font to work in the artifact and offline. Check Typodermic's licence and ask the user first.
- Possible offline build: inline three.js (~600 KB) so no CDN is needed.

## 6. Git note

This folder was not a git repository and has no remote. A local repo was initialised for this handoff; `git push` needs the user to provide a remote URL first.
