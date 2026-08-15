import { describe, expect, it } from "vitest";

import neutralFixture from "@/fixtures/face-neutral_grimace_sd.json";
import { buildCard } from "./card";
import { parseYouCamResult } from "./parse";
import { RAW_METRICS, type RawScores } from "./types";

describe("buildCard", () => {
  it("assembles a deterministic card from the ordered score values", () => {
    const scores = parseYouCamResult(neutralFixture);
    const reversed = Object.fromEntries(
      [...RAW_METRICS].reverse().map((metric) => [metric, scores[metric]]),
    ) as RawScores;

    const first = buildCard(scores);
    const second = buildCard(reversed);

    expect(first).toEqual(second);
    expect(first.id).toBe("ff-163628c5");
    expect(first.class.name).toBe("Caster of the Dry Season");
    expect(first.rarity).toBe("common");
    expect(first.weirdness).toBeCloseTo(0, 10);
    expect(first.maskUrl).toBeNull();
    expect(first.roast.length).toBeGreaterThan(0);
  });

  it("changes the fingerprint when a raw score changes", () => {
    const original = parseYouCamResult(neutralFixture);
    const changed = { ...original, moisture: original.moisture + 0.001 };

    expect(buildCard(changed).id).not.toBe(buildCard(original).id);
  });
});
