import { describe, expect, it } from "vitest";

import { CLASS_BY_WEAKEST, classifyScores } from "./classify";
import { RAW_METRICS, type RawScores } from "./types";

function scoresAt(value: number): RawScores {
  return Object.fromEntries(RAW_METRICS.map((metric) => [metric, value])) as RawScores;
}

describe("classifyScores", () => {
  it("uses the true minimum as class and curse, and the maximum as talent", () => {
    const scores = scoresAt(70);
    scores.moisture = 13;
    scores.texture = 12;
    scores.redness = 95;

    const result = classifyScores(scores);

    expect(result.classInfo.name).toBe("粗獷遊俠");
    expect(result.classInfo.flavor).toBe(
      "皮糙肉厚走天下，磨砂質感是野外生存的證明。",
    );
    expect(result.talent).toEqual({ metric: "redness", name: "冷靜之心" });
    expect(result.curse).toEqual({ metric: "texture", name: "膚理", score: 12 });
    expect(classifyScores(scores)).toEqual(result);
  });

  it("uses the paladin exception when every score is at least 85", () => {
    const result = classifyScores(scoresAt(85));

    expect(result.classInfo).toMatchObject({
      key: "dewlight_paladin",
      name: "水光聖騎士",
    });
  });

  it("defines all 15 weakest-metric mappings and shares the eyelid class", () => {
    expect(Object.keys(CLASS_BY_WEAKEST)).toHaveLength(15);
    expect(CLASS_BY_WEAKEST.droopy_upper_eyelid.key).toBe("drooping_regent");
    expect(CLASS_BY_WEAKEST.droopy_lower_eyelid).toEqual(
      CLASS_BY_WEAKEST.droopy_upper_eyelid,
    );
  });
});
