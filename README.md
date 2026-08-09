# FaceForge

**Pull your weirdest face. Forge your rarest card.**

FaceForge is a grimace-powered card battler built on the Perfect Corp **YouCam AI Skin Analysis API**. Your selfie is analyzed across 15 skin metrics; the *weirder* your expression pushes those scores, the *rarer* the card you draw. Your weakest metric becomes your RPG class ("Night Assassin" for dark circles, "Crater Warden" for pores), your best metric becomes your talent, and the resulting deterministic stat block powers a best-of-three turn-based battle — same device or online via room codes.

The core loop: **grimace → analyze → rarity from weirdness → class reveal → collect → battle.**

> Skin analysis APIs are usually framed as "find your flaws." FaceForge inverts the frame: bad scores are *good*. A face that breaks the model's expectations is a legendary pull. This makes the API's full 15-metric output — including the metrics most apps hide — the star of the game.

---

## Game loop

```
[Collection] ──► [Draw: camera + local face gate] ──► [Analysis ritual (~6s API)] ──► [Card reveal]
     ▲                                                                                  │
     └──────────────── card saved to local collection (15 classes to complete) ◄───────┘

[Battle lobby] ──► pick cards (collection = free, fresh draw = 9 API units) ──► BO3 stat duel ──► winner crowned, loser roasted
```

1. **Draw** — front camera with a live local face gate (see *Knowing the API's edges*). Hints rotate: "Make your weirdest face!" "Weirder = rarer!"
2. **Analyze** — the selfie goes to the YouCam Skin Analysis API (16 SD actions: 15 metrics + skin type). A "magic mirror" ritual screen absorbs the ~6-second task latency.
3. **Reveal** — rarity from the weirdness formula, class from your weakest metric, six battle stats derived deterministically from raw scores, plus a talent (best metric), a curse (worst metric), and a roast line from the mirror.
4. **Collect** — 15 classes to unlock. Cards live in `localStorage`; the same face + same expression always forges the same card (the model is deterministic — see below).
5. **Battle** — best-of-three. Each round both players secretly pick one stat (no repeats within a match); higher value wins the round. Card faces are public, so it's a mind game: dare to lead with your cursed stat? Two built-in NPCs (Apprentice Mochi picks randomly, the Grimace Master always plays its best remaining stat) plus same-device PvP and online rooms.

---

## Built on measured API behavior, not vibes

Every mechanic constant in FaceForge comes from real API responses, collected before the game was designed. All experiment JSON is committed under `fixtures/`.

**The expression perturbation experiment** — one identical (AI-generated) face, five expressions, each run through all 16 SD actions:

| Expression | Weirdness Σ\|Δraw\| vs neutral | Biggest single-metric move |
|---|---|---|
| squint | **239** | tear_trough **−49.3** |
| roar | **145** | wrinkle **−39.9** |
| frown | 104 | — |
| puff | 47 | wrinkle **+0.9** (puffed cheeks flatten skin — a discoverable "safe play" meta) |

Findings that shaped the design:

- **Expressions move raw scores a lot, and not uniformly "worse"** — squinting tanks tear_trough but *raises* droopy_lower_eyelid and acne. The distribution changes shape, which is why weirdness is the sum of absolute deltas across all 15 metrics (`lib/engine/weirdness.ts`), not a single-metric penalty. The neutral face's own scores are the baseline (`GLOBAL_BASELINE` — the committed `face-neutral` fixture verbatim), so the table numbers above *are* the in-game weirdness values.
- **Rarity thresholds come from the measured dynamic range**: weirdness < 60 → common, 60–150 → rare, > 150 → legendary. (Calibrated on AI-face samples; re-calibration against human faces is a known task, see *Known limitations*.)
- **Class assignment is controllable by the player** — squint reliably summons the Drooping Regent, frowning summons the Rugged Ranger. Skill expression, literally.
- **The model is deterministic**: re-running the same image with the same parameters returns raw scores identical to 14 decimal places. That makes card identity honest — `card.id` is an FNV-1a hash of the 15 raw scores (`lib/engine/card.ts`), so duplicate submissions can't farm the collection, and battle stats are fair and reproducible.
- **`raw_score`, not `ui_score`**: the API returns both, and the docs are candid that `ui_score` is psychologically adjusted to flatter the user (we measured wrinkle raw 21.1 → ui 54). A game about *weirdness* needs the unflattered signal, so the whole engine runs on `raw_score` (`lib/engine/parse.ts`).

---

## Knowing the API's edges

The judges of this integration are the people who built the API, so here is exactly where its edges are and what we do about each one — all verified by experiment, not assumed from docs.

### Local pre-check firewall (MediaPipe, zero API cost)

**Measured failure mode:** a photo where the face is small *and* off-angle does not return the documented `error_src_face_too_small`. It burns **78 seconds** of server-side retries and dies with an internal error string: `[DLQ] Max retries exhausted: list index out of range`. The clean error code only appears when the face is clear but under the size threshold.

**Mitigation:** the camera page runs MediaPipe BlazeFace (short-range) locally as WASM — assets are self-hosted under `public/mediapipe/`, so no third-party calls (`lib/faceDetect.ts`). The shutter only unlocks when a sufficiently large face is detected in frame. Consequences:

- **No-face and too-small images never leave the device.** They can't waste 78 seconds, and they can't produce garbage cards.
- The gate degrades gracefully: if the WASM detector fails to load, capture still works (`degraded` state) rather than bricking the flow.
- The backend still classifies the `list index out of range` string as `face_too_small` (`app/api/analyze/route.ts`) so even a gate miss returns an actionable "get closer!" message instead of a mystery 500.

### Spec compliance & upload discipline

- **SD mode, consistently.** SD and HD metric sets cannot be mixed per the docs, so the entire pipeline is SD (short edge ≥ 480px) — one mode, no accidental cross-mode requests.
- **Client-side downscale before upload**: canvas resize to ≤1024px long edge, JPEG q0.86 (`app/draw/page.tsx`). Measured: files over 10MB are rejected with `exceed_max_filesize` — our uploads never get near it, and upload time stays phone-friendly.
- The server independently re-validates size and JPEG magic bytes before spending any API budget (`decodeJpeg` in `app/api/analyze/route.ts`).

### Async task handling

The API is task-based (register file → presigned PUT upload → create task → poll). Our proxy (`app/api/analyze/route.ts`) implements:

- a **single 60-second deadline across the whole flow** — every fetch gets `AbortSignal.timeout(remaining)`, so a slow step can't stall the request forever;
- 1-second polling with proper terminal-state handling (`success` / `error` / running-states only — anything else is treated as an upstream fault);
- a typed error taxonomy (`face_too_small` / `no_face` / `file_too_large` / `upstream_error`) mapped to friendly mirror-speak in the UI ("The mirror can't find your face!").

The API key never reaches the browser — all YouCam traffic is server-to-server through this route.

### Occlusion honesty

Measured: the API silently scores occluded faces (headwrap over the forehead, fingers on the face) with no quality warning — scores distort without any signal. The client-side gate and framing guide are therefore load-bearing for score integrity, not cosmetic. This is also why FaceForge is a *game*: entertainment tolerates the residual distortion that a diagnostic product could not (see *What FaceForge does NOT do*).

### Unit economics

Skin Analysis costs **9 units per analysis** (verified against console billing; failed tasks don't consume units). The 1,000-unit hackathon grant ≈ **111 analyses**. Design decisions that respect that budget:

| Lever | Effect |
|---|---|
| `MOCK_YOUCAM=1` fixture mode | The full game runs on 5 committed real API responses (`fixtures/*.json`) — **zero units during development and CI**. Live calls happen only for integration verification and the demo. |
| Battles replay collection cards for free | Only a *fresh draw* costs 9 units; rematch forever at zero cost. The economy is a game mechanic, not a hidden tax. |
| Local face gate | Doomed images are rejected before they can consume a task slot (or 78 seconds of your patience). |
| Deterministic card IDs | Re-submitting the same photo can't inflate a collection, removing the incentive to spam paid calls. |
| Per-device daily draw cap *(planned, not in the demo build)* | Straightforward budget ceiling for a public deployment; the demo build runs uncapped on fixture + controlled live calls. |

Rate limiting (250 requests / 300s per IP and per token) is far above our per-user call rate by construction — one analysis per draw, human-paced.

---

## Privacy by architecture

- **Selfies are ephemeral.** The captured frame is held in `sessionStorage` only for the hop from the camera page to the reveal page (`app/draw/page.tsx` writes it, `app/draw/reveal/page.tsx` reads it). It is removed the instant analysis **succeeds**; on a failed analysis it is briefly retained so *Retry* can reuse it without re-shooting, then cleared when the user backs out via *Cancel / Retake* — and `sessionStorage` clears on tab close by definition.
- **No accounts, no database.** The collection is card JSON in the browser's `localStorage` (`lib/collection.ts`). Online battle rooms hold card data in server memory only (`lib/rooms/`) and vanish on restart.
- **Cards contain no biometrics and no image.** A card is: class, rarity, stats, weirdness, talent/curse labels, raw metric scores, and a roast string (`lib/engine/types.ts` — `maskUrl` is typed `null`). The original photo is not stored, not derivable, and not shared. Sharing a card shares numbers and a sprite, never a face.
- **On-device face detection** — the pre-check runs locally (self-hosted MediaPipe WASM); no frames are streamed anywhere during aiming.
- Upstream, YouCam task results are retained by the API for 24h per their docs; we read the JSON once and never persist their asset URLs.

---

## Design Philosophy

- **Entertainment-first skin analysis.** FaceForge repurposes the YouCam Skin Analysis API for social gaming: pull a face, get a character card, battle your friends. The game rewards *deviation* from calibrated conditions, turning what the API treats as noise into the core mechanic.
- **Privacy by design.** No photo persistence, no face templates, no cross-session identity. Photos are analyzed in-flight and discarded. A card cannot be reversed into a face.
- **Honest architecture.** The face *gate* (MediaPipe) runs locally to save API credits; the *analysis* is always the YouCam cloud API. Fixture mode is a development replay, not an offline model.

---

## Quickstart

Requirements: Node.js 20+, a modern browser. Camera capture needs a secure context (localhost is fine; use HTTPS when testing from a phone).

```bash
git clone <repo-url> && cd faceforge
npm install                  # postinstall stages MediaPipe WASM into public/mediapipe/
cp .env.example .env         # defaults to MOCK_YOUCAM=1
npm run dev
```

Open http://localhost:3000 — the full game (draw, collection, battles, NPCs, online rooms) runs on fixture replay with **zero API cost**.

### Live mode

```bash
# .env
YOUCAM_API_KEY=<your key from yce.makeupar.com API console>
MOCK_YOUCAM=0
```

Each draw now performs a real Skin Analysis task (9 units, ~6s).

### Tests

```bash
npm test          # vitest — engine (weirdness/classify/battle/rooms) + route tests
npm run lint
```

The engine is pure functions over raw scores, so the mechanics are fully unit-tested without touching the API.

---

## Tech stack

Next.js (App Router) + React, TypeScript. Phaser for the battle scene (hit-stop, particles, screen shake); DOM/CSS for draw and collection. MediaPipe Tasks Vision (WASM, self-hosted) for the local face gate. Zero database.

```
app/api/analyze/   YouCam s2s proxy: upload → task → poll, error taxonomy, fixture mode
app/draw/          camera, face gate, analysis ritual, card reveal
app/battle/        BO3 battles: same-device, NPC, online rooms
lib/engine/        pure game engine: parse → weirdness → classify → stats → card → battle
lib/rooms/         in-memory online battle rooms (KV adapter needed for multi-instance deploys)
fixtures/          real API responses from the expression experiment (fixture mode + tests)
```

## Known limitations

- Weirdness thresholds (60/150) were calibrated on AI-generated face samples; human-face recalibration is planned before final submission.
- Online rooms use an in-memory store — fine for single-process demo hosting, needs a KV adapter for serverless/multi-instance deployment (marked in `lib/rooms/server.ts`).
- Measured API caveat we inherit: occluded faces score silently; the local gate reduces but cannot eliminate this.
</content>
</invoke>
