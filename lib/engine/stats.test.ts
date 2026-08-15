import { describe, expect, it } from "vitest";

import { buildStats, STAT_LABELS } from "./stats";
import type { RawScores } from "./types";

const SCORES: RawScores = {
  oiliness: 50,
  moisture: 0,
  acne: 10,
  radiance: 100,
  wrinkle: 75,
  dark_circle_v2: 50,
  redness: 20,
  pore: 30,
  texture: 40,
  firmness: 60,
  eye_bag: 50,
  age_spot: 50,
  tear_trough: 50,
  droopy_upper_eyelid: 50,
  droopy_lower_eyelid: 50,
};

describe("buildStats", () => {
  it("maps raw scores to the six clamped RPG stats", () => {
    expect(buildStats(SCORES)).toEqual({
      hp: 1,
      mp: 99,
      def: 50,
      agi: 35,
      luk: 15,
      grit: 25,
    });
  });

  it("names grit as Weathering", () => {
    expect(STAT_LABELS.grit).toBe("Weathering");
  });
});
