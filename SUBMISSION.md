# FaceForge Submission Kit

> Devpost 提交欄位正本。影片腳本已移到 `VIDEO-SCRIPT.md`（本檔舊版腳本作廢）。

## Project Name

FaceForge

## Tagline (≤200 chars)

Pull your ugliest face, and the YouCam Skin Analysis API turns your worst skin metric into an RPG class you can duel with. Bad scores forge rare cards, and the mirror roasts the loser.

## Inspiration

Every skin analysis product opens with the same move: it scores your face and hands you a list of what is wrong with it. That framing works once. People run the scan, read that their pores rank in the bottom half, and never open it again. Brands buying skin analysis for retail campaigns hit this wall hardest, because engagement dies at the exact moment the result appears. We build ingredient-analysis tools for skincare consumers, so we have watched this reaction up close: the technology is accurate, and the delivery makes people close the app.

So we inverted the reward. If a low score forged a rarer card, would people run the analysis again? They do. They run it repeatedly, pulling worse and worse faces on purpose.

## What it does

FaceForge is a card battler where your face is the controller.

Take a selfie with the most extreme expression you can manage. A local face detector confirms a real face is in frame, then the YouCam Skin Analysis API scores 15 skin metrics. FaceForge reads those scores as character generation:

- **Your worst metric becomes your class.** The weakest pore score forges the Crater Warden. Dark circles forge the Night Assassin. There are 15 classes, one per metric.
- **Your best metric becomes your talent**, and six battle stats are derived from the raw scores.
- **Weirdness sets rarity.** Weirdness is the summed absolute deviation of all 15 raw metrics from a neutral baseline, so the further you push your expression away from a normal selfie, the rarer the card.
- **The mirror roasts you**, using your worst metric by name.

Collect all 15 classes, then fight: NPCs, a friend on the same phone, or an opponent across the table through a 4-digit room code. Best of three, stat against stat, with the loser roasted on the results screen.

For a brand running skin analysis as a campaign, this is the difference between one scan per visitor and a reason to come back: collecting 15 classes and challenging a friend both require more analyses, and every one of them runs through the same API call the brand is already paying for.

The measured payoff: the same face pulling five different expressions produced weirdness scores from 47 to 239, a 5.1x spread, so rarity is something the player controls with their face rather than a random roll.

## Results (measured on real API responses)

Controlled expression experiment, one face, five shots, SD mode, 16 actions per call:

| Expression | Weirdness (sum of absolute raw deltas) | Rarity tier | Class forged |
|---|---:|---|---|
| Puffed cheeks | 47 | Common | Crater Warden |
| Frown | 104 | Rare | Rugged Ranger |
| Roar | 145 | Rare | Crater Warden |
| Squint | 239 | Legendary | Drooping Regent |

- **Expression controls the outcome, reproducibly.** Squinting drops `tear_trough` by 49.3 and `wrinkle` by 36.3 against the neutral baseline, which is what makes it a Legendary pull.
- **The API is deterministic.** Re-submitting the same image returns scores identical to 14 decimal places, so card identity is stable and cannot be re-rolled.
- **Raw and UI scores diverge sharply.** One wrinkle reading came back as raw 21.1 and UI 54. The UI score is documented as psychologically adjusted, so the entire game engine runs on raw scores.
- **Credit efficiency.** Every game constant was derived from committed fixture responses replayed offline. Development consumed 90 of 1,000 units, under 10% of the budget, with live calls reserved for integration checks and the demo recording.

## How we built it

| Layer | Choice |
|---|---|
| App | Next.js App Router, TypeScript, Tailwind, mobile-first web |
| Skin analysis | YouCam Skin Analysis API, SD mode, 16 actions per analysis |
| Local face gate | MediaPipe BlazeFace, self-hosted WASM and model, zero external calls |
| Battle | Phaser 3 scene with hit-stop, particles, screen shake |
| API access | Server-side proxy holding the key, 60-second deadline, typed error taxonomy |
| Test basis | Committed real API responses replayed as fixtures, 109 tests |

The design decision that shaped everything: measure the API first, design the game second. The expression experiment ran before any game code existed, and the rarity thresholds, class mapping, and stat formulas all come out of those measurements.

## Challenges we ran into

**We assumed a bad photo would fail fast.** It does not. Occluded and badly framed faces get scored silently with no quality warning, and one bad input burned 78 seconds of retries before returning an internal error. The fix moved the quality gate off the API entirely: MediaPipe runs locally, and photos without a clear face never leave the device or spend a credit.

**We assumed the visible score was the score.** The API returns both a raw score and a UI score, and they disagree by more than 30 points in the low range. A game about deviation needs the unflattered signal, so we rebuilt the engine on raw scores after the first prototype produced cards that were all too similar.

**We assumed a face filling the frame was the ideal input.** It is not. Push in too close and the API returns `error_src_face_out_of_bound`, which our proxy had been folding into a generic upstream failure, so the player only saw "the mirror went cloudy" with no way to act on it. It now maps to its own 422 and a message that tells you to back off, which is the difference between a dead end and a retry.

## Known limitation

Our rarity thresholds are calibrated on AI-generated faces, and the API's own calibration is documented for real photography, so the numbers in the table above carry that caveat. The fix is a per-user baseline: compare a player's neutral shot against their own grimace instead of against a global threshold. We state this rather than hide it.

## What we learned

An analysis API's least flattering output is its most playable one. The scores a beauty product has to soften are exactly the scores a game can reward, and the same endpoint serves both once you stop treating a low number as bad news.

## What's next

- Per-user baseline rarity, replacing global thresholds calibrated on AI faces
- Apparel VTO integration so a forged class comes with a costume to try on
- Per-device daily draw caps for public deployment budget control

## Built With

next.js, typescript, tailwind-css, youcam-skin-analysis-api, mediapipe, phaser, vitest

## Links

- GitHub: https://github.com/cyh7789/faceforge
- Demo video: https://youtu.be/Q7UgsIm-Es8

## YouTube upload

Settings: **Public** (rules require publicly visible), no music track, no third-party trademarks. Upload `video-assets/faceforge-demo.srt` as English captions and `video-assets/faceforge-thumbnail.png` as the custom thumbnail.

**Title**

FaceForge: your worst skin score forges a legendary card | YouCam Skin Analysis API Hackathon

**Description**

Skin analysis apps grade your face and tell you what to fix. FaceForge takes the same scores and forges a fighter out of them.

Pull the weirdest face you can. A locally hosted MediaPipe face detector clears the shot before anything leaves the device, then the YouCam Skin Analysis API scores 15 skin metrics. Your weakest metric picks your RPG class, your strongest becomes your talent, six battle stats come out of the raw scores, and the mirror roasts you for whichever one let you down. Collect 15 classes, then duel a friend on the same phone, best of three.

Everything on screen is a live run against the API. The rarity thresholds, class mapping and stat formulas were all measured from real responses before the game existed: one face pulling five expressions moved the summed deviation across all 15 metrics from 47 to 239, and the API is deterministic to 14 decimal places, so the same face always forges the same card.

Built for the YouCam API Skin AI & Apparel VTO Hackathon by Perfect Corp.

Code: https://github.com/cyh7789/faceforge

Chapters:
0:00 Two faces enter
0:02 What FaceForge does
0:10 Both players scan at once
0:24 Cards forged from 15 metrics
0:36 Collection and constellation backs
0:51 Into the arena
0:57 Best-of-three stat duel
1:09 The credit firewall
1:27 Closing

**Tags**

youcam api, perfect corp, skin analysis, hackathon, devpost, ai, card game, mediapipe, nextjs, phaser, computer vision, web game

## Devpost form: text description (paste as one field)

FaceForge is a mobile web card game where your face is the controller. It runs on the YouCam Skin Analysis API, and it treats a low skin score as a reward instead of a defect.

FEATURES
- Draw a card from a selfie: pull the most extreme expression you can, and the analysis becomes a character.
- 15 RPG classes, one for each metric the API scores. Your weakest metric picks the class, your strongest becomes your talent.
- Six battle stats derived from the raw scores, plus a curse and a roast that names the metric that let you down.
- A card back that plots a constellation from your own wrinkle readings.
- A 15-slot collection album that tracks which classes you have unlocked.
- Three ways to duel, best of three, stat against stat: an NPC, a friend on the same phone, or an opponent on another phone through a 4-digit room code.
- Save any card as an image to share.

HOW IT WORKS
Take a selfie or pick a photo. A MediaPipe BlazeFace detector, self-hosted as WASM with zero external calls, confirms a real face is in frame before anything is sent, so a photo that would be wasted never reaches the API and never spends a unit. A server-side proxy holds the API key and calls the YouCam Skin Analysis API in SD mode, 16 actions, returning 15 raw skin metrics. The game engine reads that response as character generation: weakest metric to class, strongest to talent, summed absolute deviation from a neutral baseline to rarity, and the six battle stats from the same raw values. The engine runs on raw scores rather than the flattering UI scores, because a game about deviation needs the unflattered signal.

CONSUMER AND RETAIL VALUE
A conventional skin scan is one API call per visitor, and engagement ends at the result screen: the product just told the person what is wrong with their face. FaceForge inverts that reward, so the visitor wants to run it again. Collecting 15 classes and challenging a friend both require more analyses, and every one of them is another call on the API a brand is already paying for. It also reaches people who would never open a skincare scanner, because nothing in the experience asks the player to care about their pores. For a brand activation, an event booth, or a retail campaign, that is the difference between one scan per visitor and a reason to come back.

EVIDENCE
Rarity is steered by the player, not rolled: in our measurements, one face pulling five different expressions moved the summed deviation across all 15 metrics from 47 to 239, a 5.1x spread. Card identity is stable because the API is deterministic to 14 decimal places, so the same face always forges the same card. Every game constant was measured from committed real API responses before the game was written, and those fixtures replay offline, which is how the whole build cost 90 of our 1,000 units. The engine ships with 110 passing tests.

## Devpost form: Additional info answers

**Submitter type**: Individual
**Country of residence**: Taiwan
**App Status**: New app, built during the hackathon
**What date did you start this project?**: 07-16-26 (first commit)
**If existing, explain what you updated**: not applicable, the project was started for this hackathon

**Was there a moment during the hackathon where the API surprised you, in a good or frustrating way?**

The good one was the afternoon we re-submitted the same photo just to see whether our card IDs would be stable. We expected small drift and were ready to round the scores to make the game work. Every one of the 15 metrics came back identical to 14 decimal places. That single test decided the design: the card became a promise instead of a roll, because your face and only your face produces it.

The frustrating one came earlier the same week. A test shot taken slightly too far from the camera sat there for about 78 seconds before failing with an internal error, and a shot with hair across the forehead came back scored, confidently, with no warning that half the face was covered. We had assumed the API would tell us when an input was unusable. Finding out that it will not is what pushed the quality check onto the device.

**Are there industries or use cases you think Perfect Corp.'s API could serve that nobody is talking about yet?**

Two, and neither one is a beauty product.

**Entertainment and live events.** Skin analysis works as an input device. The 15 raw metrics are a signal the user can steer with their face: in our own measurements, one person pulling five expressions moved the summed deviation across all metrics from 47 to 239. That range is enough to drive a card game, an arcade cabinet, a photo booth, or a brand activation at an event, and it reaches people who would never open a skincare scanner. We built the card game to prove the range is real.

**Caregiving, with the family member as the operator.** Every skin analysis product assumes the person holding the phone is the person being analyzed. A weekly skin log for an elderly relative flips that: the operator is a daughter or a home aide, and the subject may not be able to hold still or follow framing instructions. Nobody is building for that operator, and the market is large and growing. It is also the harder engineering problem, because it needs tolerance for imperfect framing and a signal for how much of the face was actually usable, which is the one thing we would ask of the API before building it.

**Where did you hit a wall technically? How did you work around it?**

Photo quality, twice, in opposite directions. Framing a face too small returns one error, and framing it so it fills the frame returns another, `error_src_face_out_of_bound`, which our proxy had been folding into a generic failure so the player saw "the mirror went cloudy" with nothing to act on. We now map it to its own status with a message that says to back off. The larger fix sits earlier in the pipeline: MediaPipe BlazeFace runs locally as a self-hosted WASM build, so photos without a clear face never leave the device, never spend a unit, and never trigger the 78-second retry path. The same discipline covered development itself. Every real API response is committed as a fixture and replayed offline, which is how the whole game was designed and built on 90 of our 1,000 units, with live calls saved for integration checks and filming.

## Gallery images (upload from video-assets/gallery/, in this order)

Five slides, architecture first. Each is 1920x1080 with the point set in display type, so it still reads at thumbnail size.

1. `00-architecture.png` — how one selfie becomes a card, and why the gate sits before the API
2. `02-card-reveal.png` — the weakest metric becomes the class
3. `07-credit-firewall.png` — a faceless photo is blocked on device, zero units spent
4. `06-battle-result.png` — match winner, and the roast naming the metric that lost
5. `04-collection.png` — 15 classes, one per metric the API scores

`01-face-gate.png`, `03-card-back.png` and `05-battle.png` are built too, if more slots are wanted. Raw phone screenshots stay in `video-assets/screenshots/`.
