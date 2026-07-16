import { describe, expect, it } from "vitest";

import neutralFixture from "@/fixtures/face-neutral_grimace_sd.json";
import { parseYouCamResult } from "./parse";
import {
  calculateWeirdness,
  GLOBAL_BASELINE,
  rarityFromWeirdness,
} from "./weirdness";

describe("calculateWeirdness", () => {
  it("is approximately zero for the neutral fixture", () => {
    const neutral = parseYouCamResult(neutralFixture);

    expect(calculateWeirdness(neutral)).toBeCloseTo(0, 10);
    expect(neutral).toEqual(GLOBAL_BASELINE);
  });
});

describe("rarityFromWeirdness", () => {
  it.each([
    [59.999, "common"],
    [60, "rare"],
    [150, "rare"],
    [150.001, "legendary"],
  ] as const)("maps %s to %s", (weirdness, expected) => {
    expect(rarityFromWeirdness(weirdness)).toBe(expected);
  });
});
