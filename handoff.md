# Handoff: Crash City (formerly "Harbor Heat")

Current version: **2.0** (on `main`): 1.9 + the score/Battle Pass rebalance + a reworked car-jack animation (2026-10-15). 1.8 and 1.9 were made by another agent and pushed as GitHub user `vilmerfrost`; this file only covers the parts of them that later work touched, so read the code and the `tools/sim*.js` headers for the rest. Everything below is what a new agent needs to continue without re-reading the old conversation.

Repo: `https://github.com/caesarlynch0912-hue/crash-city`. `main` holds the game (`index.html`) plus these notes and tools. The `claude-handoff` branch is the original 1.4 handoff snapshot (older game copies, Electron stub); it is history now and not needed for new work.

## 1. The user and how to work with them

- Swedish teenager/student, writes short casual Swedish ("bror", "fixa", typos). **Reply in Swedish.** Keep explanations plain; they care about results, not internals.
- Works on a **school laptop** (Windows 11 Education, user `ad87546`, AMD Ryzen 3 7335U with integrated GPU, 16 GB RAM). Performance matters: this machine is weak.
- **School network DNS (`edudns1.stockholm.se`) cannot resolve `*.frame.claudeusercontent.com`**, so the claude.ai artifact link does not load for them at school. Always also deliver a standalone `.html` file via SendUserFile. cdnjs, jsdelivr and fonts.cdnfonts.com ARE reachable.
- They play in the standalone file or in the app's Browser pane (localhost preview). Their saves live in that origin's localStorage (best score ~13 934, many cars owned, wallet ~272 coins).
- Request history, in order: copy a GTA browser game (refused: copyright; built an original instead) → 2D top-down game → 3D → better graphics → survival chase instead of missions → sound/engine/garage/solid buildings → weapons + "fun stuff" → bigger map, biomes, slower/realistic cars → cleaner menus → easier unlocks, more cars, more power-ups → character fix, skins menu, car-jack animation, challenges → a game-feel design doc was implemented and then **reverted on request** ("ta bort allt från senaste prompten", that state was named 1.1) → rename to Crash City + Pricedown font → English version, power-up text must not block the view, coins instead of cash, coin counter, bug hunt with 10k–50k test runs → clean HUD, more/shinier coins, language picker (7 languages) shown at startup, better character, lower top speed on best cars, more police from more directions, Shift nitro → **blocky (not rounded) characters + fix lag** (1.4, done).
- Besides this 1.4 handoff, versions 1.4–1.6 were pushed to `main` from the user's GitHub account; 1.6 adds over 1.4: Shift = drift (bonus points), Space = nitro in the car / jump on foot, V = punch; police roadblocks from 2 stars; more and faster hunters per wanted star; wrecks explode a moment later and can chain; ploughing through civilian traffic keeps momentum; top cars cost much more score (7 000 → 100 000) and the golden key only unlocks cars up to 10 000; fixed-step interpolation and frame-rate-independent camera smoothing.
- **1.7** (this PC, 2026-10-14): Battle Pass (asked for in Swedish: "Battle pass" with "coola skins som t.ex tung tung sahur och John pork", unlocked at 10k score) and controls swapped back in the car: **Shift = nitro, Space = drift** (on foot unchanged: Space jump, Shift sprint, V punch).
- **1.8–1.9** (pushed as `vilmerfrost`, 2026-10-14 evening): game modes (Heist, Time Trial, Demolition), player level/XP (`hh-prog`) and coin-bought car upgrades, achievements, daily missions and login streak, reward FX, a 26×26 map (highway ring, river, stunt jump, airport, new districts), 4 new vehicles, 3 power-ups, hidden packages, unique stunt jumps, rampages, destructible street props, day/night, weather, cinematic explosions. New tests: `tools/simach.js, simmap2.js, simmodes.js, simprog.js, simprops.js, simstuff.js`.
- **Score rebalance** (2026-10-15, user: "make the games score harder. So you cant complte battle pass insta in one run"): a measured immortal bot made 97k–148k points in 8 minutes and finished the whole 48k pass in one run. Changes: wreck score multiplier capped at `COMBO_MAX`=4 (combo counter itself still climbs for challenges) and base 150/400 → 120/300; airtime 400 → 180 points per second; points per second `3+wanted*3+(military?10:0)` (was `6+wanted*5+20`); Battle Pass tiers escalate (see below). Afterwards the same bot reaches 50k–68k in 8 minutes = tier 4–5 of 12.
- **2.0** (2026-10-15, user: "skapa 2.0 och fixa animationen när man öppnar främlingars bil"): only the car-jack sequence changed, plus the version label. `jackPt(c,along,side)` gives points beside the driver's door. The player waits at `-0.18*w` (behind the open door's swing), the door opens in phase `pull`, the driver spawns in the door gap and stumbles out and towards the rear (`pushA = a-PI/2-.25`, never through the player, min ~8 units), then in `enter` the player steps into the gap, slides to the seat, and the door shuts after him. Cars without a driver also open the door first (short `pull`). While jacking, the camera stays behind the car instead of swinging sideways. The user rejected a bigger 2.0 plan (Battle Pass season 2, new cars), so ask before adding features.
- They also work on a second Windows 11 PC (user `caesa`), where the repo lives at `C:\Users\caesa\Projects\crash-city`.
- The user has not asked to publish code anywhere beyond this GitHub repo.

## 2. Files in this folder

| Path | What it is |
|---|---|
| `index.html` | **The single source of truth.** One complete HTML file (doctype/head/body included), no build system. Edit it directly; it is also the standalone file to send the user (copy it to `Crash-City-vX.Y.html` for delivery). |
| `README.md` | Short Swedish description of the game. |
| `.claude/launch.json` | Preview server config `crash-city` (node one-liner on port 5177 serving `index.html`). Start with `preview_start name=crash-city`. Same port as before, so localhost saves carry over. |
| `tools/fuzz.js` | Parallel fuzz tester (worker_threads). `node tools/fuzz.js index.html <perWorker> <workers>`. ~13 scenarios/s per 7 workers. |
| `tools/sim2.js` | Wall-collision + ram test + garage unlock test. |
| `tools/sim4.js` | 10-min combat simulation (all weapons, ramps, heli, military). |
| `tools/sim9.js` | Car-jack phase test + challenge completion test. |
| `tools/simbp.js` | Battle Pass test (lock/unlock at 10 000, tier rewards, reload persistence, old-record unlock) + Space-drift/Shift-nitro check. Exits 1 on any failure. |
| `tools/i18ncheck.js` + `tools/dict.js` | Checks every `tr()/trf()` key and visible Swedish text has all 6 translations and placeholders survive. `node tools/i18ncheck.js index.html`. `dict.js` is a copy of the `const DICT=` object embedded in `index.html` (regenerated from 1.6); when you add strings, update both. |
| `tools/removed-game-feel-version.html` | The reverted "game feel" version (slip/drift model, combo bank, skid marks, speed lines, medals, settings sliders, 28 unit tests). Kept only in case the user wants pieces back. |

All the `tools/*.js` scripts take the HTML file as their argument and slice the `<script>` block up to the `/* ================= 3D` marker, so they work on `index.html` as-is.

**Windows pitfall (bit us twice):** the filesystem is case-insensitive. `Index.html` and `index.html` are the SAME file. Never name a deliverable anything that matches the source case-insensitively, and never `rm` such a name.

Artifact: `https://claude.ai/artifact/2pisP4drM5uE4tbPeuurF2` (it was published from the old unwrapped `harbor-heat.html`, so republishing from `index.html` needs the artifact's URL passed explicitly). The CSP blocks the Pricedown stylesheet there, so the artifact falls back to Bungee.

## 3. Architecture of `index.html`

Plain JS + three.js r128 (UMD from cdnjs) + jsdelivr `three@0.128.0/examples/js/` (CopyShader, LuminosityHighPassShader, EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, BufferGeometryUtils). Fonts: Google Fonts (Bungee, Chakra Petch) + `fonts.cdnfonts.com/css/pricedown` (`--display` = Pricedown, `--small` = Bungee for small HUD labels).

Script order (important: everything before the `/* ================= 3D` marker is pure logic with no THREE, which is what the Node test harnesses slice and run):

1. **i18n core** at the top: `LANGS`, `LANG` (localStorage `hh-lang`), `DICT` (Swedish key → `[en,de,fr,es,da,no]`), `PLACES`, `tr(s)`, `trf(s,{vars})`, `LOCALE()`. **The game already uses a global `T` for time, so translation is `tr`/`trf`, never `T`/`F`.** Swedish strings in code are the keys.
2. **City data**: 14×14 grid, `CELL=480, ROAD=120, WORLD=6840`. Biomes via `biomeOf()` (downtown, suburb, park, harbor, forest, farm, beach). Every solid thing is a rect in `block.bld` (`type`: tower, house, warehouse, cont, barn, silo, bale, hut, lifeguard, fountain, water, tree, leg). `solid()`, `isRoad()`, `freeCircle()` (checks centre + 8 points), `curbPoint()`, `roadPoint()`.
3. **Entities**: `cars`, `peds`, `coins` (trails of 5–8 along roads, 30 trails), `parts`. `player` has `nitro/nitroOn/nitroWait`, `jack` (car-jack state), `car`.
4. Input, game state, power-ups (`POWER`, 17 + `KEYDEF` golden key, tiers at 0/600/1800/4000 pts), `fx` timers.
5. Driving physics `drive()` (power-limited acceleration, sub-stepped movement, wall sliding, `unstick()`), civ AI on lanes, cop/army AI `updateCop()` (chases decoy, slow-mo, freeze). `spawnEnemy()` spawns head-on (35%, only after 8 s), from the sides (25%) or from behind (25%), else anywhere. `spawnRoadblock()` parks 2–3 cops across the road ahead from 2 stars (`blockT` timer, cop `block` hold). Hunter speed/acceleration rise with each star. Wanted levels: cops `[0,3,6,9,12,14]`, military after 140 s (12 cops + up to 10 army). Player drifting uses `c.ma` (travel direction) vs `c.a` (nose).
6. Collisions, peds, `updateWorld()` (score, escalation, coins, bust/wasted).
7. Garage (`CAR_SPECS`, 15 cars, unlocked by score, golden key (only cars with `req <= KEY_MAX_REQ` = 10 000), or bought with coins: `carPrice = req/20` rounded to 5).
8. Combat (5 weapons, tracers, rockets, mines, barrels, heli, ramps, airtime, near-miss, drift, combos), challenges (`CHAL_DEFS`, 3 active), skins (`SKINS`: 8 unlocked by total challenges `stats.chal`, plus 6 Battle Pass skins with `bp:<tier>` and a custom `head` built by `buildSpecialHead`: John Pork `pig`, Ballerina Cappuccina `cup` + `tutu`, Tung Tung Tung Sahur `log` + `bat`, Tralalero Tralala `shark`, Bombardiro Crocodilo `croc`, Guld-Sahur metal `log`), **Battle Pass** (`BP_UNLOCK` 10 000 in one run, or an old `hh-best` ≥ 10 000; then every scored point is XP; tier n costs `BP_BASE + (n-1)*BP_GROW` = 8 000, 10 000, … 30 000 (`BP_STEP_AT(t)` is the cost from tier t, `bpXPFor(n)` the running total, 228 000 for all 12; a save whose xp is below `bpXPFor(tier)` is lifted to it on load so earned tiers are kept), 12 tiers in `BP_TIERS` built from the `bp` skins plus `BP_COINS`; rewards are granted automatically in `updateBP()` each tick; screen `bpass` / `renderBP()`; skin cards there open the Skins preview), car-jacking (`enterCar` → walk/pull/enter → `takeCar`).
9. `endRun`, `showOver`, `resetRun`, `tick()` (fixed 60 Hz).
10. **3D**: renderer, quality tiers (`QUAL`, `applyQuality`, `autoQuality`, setting `hh-gfx` auto/high/low), bloom composer, sky/env, static world batched per material+chunk (`addStatic`/`flushStatic`, non-indexed merge), buildings, cars (`buildCar`, door pivot, LOD hides details beyond 520), people (`buildPed`, `buildHero` both **blocky boxes**, `poseHero`/`animPed`), instanced coins and barrels, power-up/combat visuals.
11. Minimap, HUD (`renderHud`), notices (`notify()`; big `toast(...,true)` only for KÖR/BUSTED/WASTED), audio (all synthesized WebAudio, radio sequencer), garage/skins/settings/language screens, menu system (`SCREENS`, `showScreen`, `backScreen`, pause), frame loop (`acc` capped at 4 ticks; `snapPrev`/`lerpIn`/`lerpOut` draw cars, peds and the player between the last two 60 Hz steps, and `updateCamera(fk)` smooths per real frame time).

localStorage keys: `hh-lang, hh-best, hh-garage, hh-coins, hh-stats, hh-skin, hh-mute, hh-radio, hh-gfx, hh-bp` (`{on,xp,tier}`).

## 4. Testing status

- Fuzz totals across sessions: 21 000 + 2 100 + 10 500 + 2 100 scenarios (~10 M ticks). Last two runs: **0 failures**. Bugs it found and that are fixed: player pushed into walls by cars, player exiting into a 6×6 tree (fixed by checking the centre in `freeCircle` + `unstickPlayer()` on exit), particle overshoot (hard cap 700 at end of tick).
- Rebalance on 1.9 (2026-10-15): all tools pass (sim2, sim4, sim9, simbp, simach, simmap2, simmodes, simprog, simprops, simstuff; i18ncheck only the 4 intentional misses, it always exits 1 because of them), fuzz 2 100 scenarios 0 failures, no console errors in the browser. `simbp.js` now reads the tier costs from `bpXPFor` and checks escalation, the 200k+ total and old-save migration. Score measurement script (bot, 8-minute runs, tally per `addScore` caller) was a scratch file, not committed; rebuild it from `tools/sim4.js` if needed.
- Not re-measured after the rebalance: the mode payouts (Heist/Time Trial/Demolition), rampage (+5 000), stunt jumps (+1 500) and car unlock score thresholds; a human run is shorter than the bot's 8 minutes.
- 1.7: simbp 20/20 runs clean, sim2 0 overlaps, sim4 clean, sim9 OK, fuzz 2 100 scenarios 0 failures, i18ncheck only the 4 intentional misses, no console errors in the browser. The Browser pane does not run rAF here (0 ticks/s), so in-browser checks drive `tick()` by hand.
- 1.6 on `main` (2026-10-14): `sim4` crashed in `collide()` because crash damage can wreck the player's car (clearing `player.car`) before the civilian-shove code read `player.car.a`; fixed by using the colliding car. After the fix: sim2 0 overlaps, sim4 clean, sim9 OK, fuzz 2 100 scenarios 0 failures, i18ncheck only the 4 intentional misses.
- Perf in the 1046×682 preview window: one frame 5.5 ms (was 9 ms), 2 396 objects (was 3 947), 2 lights (was 8). Not yet measured on the user's real full-screen machine.
- `tools/i18ncheck.js` reports 4 "missing" that are intentional (JS-overwritten placeholders and the multilingual eyebrow on the language screen).
- The Browser pane often throttles rAF when hidden; use JS to call `renderHud()/renderSkinPreview()` before screenshots, and expect very low FPS there.

## 5. Open items / likely next asks

- Ask the user whether 1.6 still stutters on their machine (1.6's interpolation may already have fixed it); if yes, next levers: fewer visible peds/cars, cheaper buildings, `Grafik: Låg` default, smaller lamp pools, InstancedMesh for peds.
- `stats.chal` may show 30 because of an earlier test that may not have been fully restored. Offer to reset if the user says it is wrong.
- The Electron `.exe` idea from early on is paused (they said "skapa inte den än").
- Pricedown could be inlined as a data-URI font to work in the artifact and offline. Check Typodermic's licence and ask the user first.
- Possible offline build: inline three.js (~600 KB) so no CDN is needed.

- Version label: `const VERSION` and the start-screen footer (now 2.0); bump both together.
- On this PC the localhost:5177 save already finished the pass (tier 12) before the rebalance. Ask the user whether to reset it so they can play the harder pass; do not reset without a yes.
- Battle Pass ideas if asked: a HUD progress chip during runs, a season 2 with new skins, cars as rewards. Gold (metal) skins look dark in the Skins preview because that scene has no environment map; Guldkalven has the same issue.
- On this PC the localhost:5177 save has best 10 429, so the pass is already open there (tier 0).

## 6. Git note

The project lives on GitHub (`caesarlynch0912-hue/crash-city`, default branch `main`). Commit on `main` unless the user asks for a branch, and only push when the user says so.
