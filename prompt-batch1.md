# Batch 1: FaceForge core engine + /api/analyze + fixture mode + tests

You are working in a fresh Next.js 15 (App Router, TypeScript, Tailwind) repo at the current directory. Build the game's logic core. NO UI in this batch.

## Reference materials (read them first)

- `../youcam-skin/DESIGN.md` — full game design: page flow, API contract (section 二), battle rules. The API contract there is the source of truth.
- `../youcam-skin/scripts/rpg_card_spike.py` — Python spike of the RPG mapping (stats/class/talent/curse). Port its logic; Chinese class names and flavor text must be preserved exactly.
- `../youcam-skin/scripts/grimace_analysis.py` + `../youcam-skin/results/grimace-report.md` — weirdness (Σ|delta| vs neutral baseline) and rarity thresholds: <60 common / 60-150 rare / >150 legendary.
- `../youcam-skin/results/face-*_grimace_sd.json` — 5 real API fixtures (neutral/frown/squint/puff/roar). Copy them into `fixtures/` in this repo.
- `../youcam-skin/scripts/skin_test.py` — real YouCam s2s API flow (file register → PUT upload → create task → poll). Port for the live mode.

## Deliverables

### 1. `lib/engine/` — pure functions, fully unit-tested (vitest)

- `types.ts` — RawScores (15 metrics), Card, Stats, Rarity, ClassInfo per DESIGN.md contract
- `parse.ts` — parse YouCam task-result JSON → RawScores (handle skin_type/all/skin_age/resize_image entries gracefully)
- `stats.ts` — six stats mapping from the spike (HP moisture / MP radiance / DEF firmness+texture / AGI pore+texture / LUK acne+redness / EXP 100-wrinkle). Rename EXP display key to `grit`（中文「風霜」）— age narrative was removed by design.
- `classify.ts` — class = lowest raw metric (CLASS_BY_WEAKEST table from spike, all 15 entries + PALADIN all>=85 exception); talent = highest metric (TALENT_BY_BEST table)
- `weirdness.ts` — Σ|delta| vs the neutral baseline (hardcode the face-neutral fixture's raw scores as GLOBAL_BASELINE const); rarity thresholds 60/150
- `card.ts` — assemble full Card object; `id` = stable hash of raw scores (deterministic)
- `roast.ts` — 毒舌文案庫: per class 3-5 lines 繁體中文台灣用語, funny-mean-then-soft tone (「毛孔 45 分還敢來？…好啦其實蠻有勇氣的」style). Pick deterministically by card id hash.
- `battle.ts` — BO3 spin battle: `spinBattle(cardA, cardB, rng)` → rounds: each round picks 1 of 6 stats via injected rng, higher value wins round, ties respin; first to 2 wins. Pure function, rng injectable for tests. No buffs (design decision).

### 2. `app/api/analyze/route.ts`

- POST { image: base64 jpeg, mode?: string } → { card } per DESIGN.md contract
- `MOCK_YOUCAM=1` (env): ignore image, return a random fixture from `fixtures/` through the same parse→card pipeline
- Live mode: YouCam s2s flow (register→upload→create task with all 16 SD actions→poll до success/error, ~6s typical, 60s timeout). API key from `YOUCAM_API_KEY` env. Map upstream errors to { error: "face_too_small"|"no_face"|"file_too_large"|"upstream_error" } with proper HTTP codes.
- Skip mask download/storage for now (P1) — include `maskUrl: null`.

### 3. Tests (vitest + npm script "test")

- Engine: each module unit-tested. Key invariants: determinism (same scores → same card id/class), classify picks the true minimum, weirdness of neutral fixture ≈ 0, rarity thresholds, battle BO3 with seeded rng (win/loss/tie-respin paths).
- Fixture pipeline: all 5 fixtures parse → valid Card, and their expected classes match grimace-report.md's 單拍 column (neutral→乾燥大法師, frown→粗獷遊俠, squint→垂簾聽政者, puff→隕坑守望者, roar→隕坑守望者).
- API route: mock-mode integration test (call handler directly).

### 4. Housekeeping

- `.env.example` (YOUCAM_API_KEY=, MOCK_YOUCAM=1); ensure `.env*` gitignored
- `git init` + initial commit "chore: scaffold" (scaffold as-is) + second commit "feat: core engine + analyze API + fixtures" — conventional commits
- Final output: `npm test` full run result + file tree of lib/engine

## Rules

- TypeScript strict; no `any` unless annotated why
- Pure functions in lib/engine (no fetch/env there); IO only in the route
- Do NOT touch app/page.tsx or UI files beyond what's needed to keep build green
- `npm run build` must pass at the end
