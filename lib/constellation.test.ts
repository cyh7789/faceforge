import { describe, expect, it } from "vitest";

import { CLASS_BY_WEAKEST, PALADIN } from "./engine/classify";
import { RAW_METRICS, type RawScores } from "./engine/types";
import {
  createConstellationLayout,
  fortuneForClass,
  getConstellationZoneScores,
  type ConstellationStar,
  type ConstellationZone,
} from "./constellation";

function scoresAt(value: number): RawScores {
  return Object.fromEntries(RAW_METRICS.map((metric) => [metric, value])) as RawScores;
}

function starsIn(
  stars: readonly ConstellationStar[],
  zone: ConstellationZone,
): ConstellationStar[] {
  return stars.filter((star) => star.zone === zone);
}

function averageBrightness(stars: readonly ConstellationStar[]): number {
  return stars.reduce((sum, star) => sum + star.brightness, 0) / stars.length;
}

describe("wrinkle constellation layout", () => {
  it("returns the exact same layout for the same card id and raw scores", () => {
    const scores = scoresAt(52);

    expect(createConstellationLayout("ff-12345678", scores)).toEqual(
      createConstellationLayout("ff-12345678", { ...scores }),
    );
  });

  it("maps wrinkle to forehead, texture to under-eye, and pore to smile lines", () => {
    const scores = scoresAt(80);
    scores.wrinkle = 11;
    scores.texture = 22;
    scores.pore = 33;

    expect(getConstellationZoneScores(scores)).toEqual({
      forehead: 11,
      underEye: 22,
      smileLine: 33,
    });
  });

  it.each([
    ["forehead", "wrinkle"],
    ["underEye", "texture"],
    ["smileLine", "pore"],
  ] as const)(
    "makes the %s cluster denser and brighter when %s is worse",
    (zone, metric) => {
      const strong = scoresAt(100);
      const rich = scoresAt(100);
      rich[metric] = 0;

      const strongStars = starsIn(
        createConstellationLayout("ff-zone-test", strong).stars,
        zone,
      );
      const richStars = starsIn(
        createConstellationLayout("ff-zone-test", rich).stars,
        zone,
      );

      expect(richStars.length).toBeGreaterThan(strongStars.length);
      expect(averageBrightness(richStars)).toBeGreaterThan(
        averageBrightness(strongStars),
      );
    },
  );

  it("keeps every star inside its implied face-region zone", () => {
    const { stars } = createConstellationLayout("ff-face-zones", scoresAt(0));

    for (const star of starsIn(stars, "forehead")) {
      expect(star.x).toBeGreaterThanOrEqual(0.28);
      expect(star.x).toBeLessThanOrEqual(0.72);
      expect(star.y).toBeGreaterThanOrEqual(0.24);
      expect(star.y).toBeLessThanOrEqual(0.35);
    }
    for (const star of starsIn(stars, "underEye")) {
      expect(star.x).toBeGreaterThanOrEqual(0.22);
      expect(star.x).toBeLessThanOrEqual(0.78);
      expect(star.y).toBeGreaterThanOrEqual(0.4);
      expect(star.y).toBeLessThanOrEqual(0.52);
    }
    for (const star of starsIn(stars, "smileLine")) {
      expect(star.x).toBeGreaterThanOrEqual(0.25);
      expect(star.x).toBeLessThanOrEqual(0.75);
      expect(star.y).toBeGreaterThanOrEqual(0.54);
      expect(star.y).toBeLessThanOrEqual(0.76);
    }
  });

  it("provides one deterministic bilingual fortune for every class", () => {
    const classKeys = new Set([
      ...Object.values(CLASS_BY_WEAKEST).map(({ key }) => key),
      PALADIN.key,
    ]);
    const fortunes = [...classKeys].map((classKey) => fortuneForClass(classKey));

    expect(classKeys.size).toBe(15);
    expect(fortunes).toHaveLength(15);
    expect(new Set(fortunes)).toHaveLength(15);
    for (const fortune of fortunes) {
      expect(fortune).toMatch(/[\u3400-\u9fff].* · [A-Za-z]/);
    }
  });
});
