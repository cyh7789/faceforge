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

- **Your worst metric becomes your class.** Pores at 50 forges the Crater Warden. Dark circles forge the Night Assassin. There are 15 classes, one per metric.
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
- Demo video: (YouTube link, pending upload)

## Devpost form: Additional info answers

**Submitter type**: Individual
**Country of residence**: Taiwan
**App Status**: New app, built during the hackathon
**What date did you start this project?**: 07-16-26 (first commit)
**If existing, explain what you updated**: not applicable, the project was started for this hackathon

**Was there a moment during the hackathon where the API surprised you, in a good or frustrating way?**

Both, and they turned out to be the same property. The frustrating half came first: a badly framed photo does not fail fast. It gets retried silently for 78 seconds before returning an internal error, and an occluded face gets scored with no quality warning at all, so the client cannot tell a good reading from a bad one. The good half is that the model is exactly reproducible. Re-submitting the same image returns scores identical to 14 decimal places, which is what let us promise players that the same face always forges the same card. We could build a collectible identity on top of the API without storing a single photo or biometric ourselves.

**Are there industries or use cases you think Perfect Corp.'s API could serve that nobody is talking about yet?**

Two, both of which come from treating skin analysis as an input device rather than as a diagnosis.

First, entertainment and live events. The 15 raw metrics are a rich, player-controllable signal: in our own measurements, one face pulling five expressions moved the summed deviation from 47 to 239. That is enough range to drive a game, a photo booth, or an on-stage interactive, and it puts the API in front of people who would never open a skincare scanner.

Second, stateless identity for campaigns. Because the scores are deterministic to 14 decimal places, a hash of the raw vector works as a per-face token for things like one-entry-per-person giveaways or returning-visitor detection, without the operator ever storing a photo or a face embedding. The privacy story is unusually clean for that class of problem.

**Where did you hit a wall technically? How did you work around it?**

Photo quality, twice, in opposite directions. Framing a face too small returns one error, and framing it so it fills the frame returns another, `error_src_face_out_of_bound`, which our proxy had been folding into a generic failure so the player saw "the mirror went cloudy" with nothing to act on. We now map it to its own status with a message that says to back off. The larger fix sits earlier in the pipeline: MediaPipe BlazeFace runs locally as a self-hosted WASM build, so photos without a clear face never leave the device, never spend a unit, and never trigger the 78-second retry path. The same discipline covered development itself. Every real API response is committed as a fixture and replayed offline, which is how the whole game was designed and built on 90 of our 1,000 units, with live calls saved for integration checks and filming.

## Screenshots (for Devpost)

1. Draw screen with the local face gate confirming a face
2. Card reveal: class, rarity, six stats, talent, curse, roast
3. Collection grid with unlocked classes
4. Battle: stat duel mid-reveal with hit-stop
5. Card back: the wrinkle constellation drawn from the analysis
