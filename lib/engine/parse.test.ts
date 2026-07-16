import { describe, expect, it } from "vitest";

import { parseYouCamResult } from "./parse";

const METRICS = [
  "oiliness",
  "moisture",
  "acne",
  "radiance",
  "wrinkle",
  "dark_circle_v2",
  "redness",
  "pore",
  "texture",
  "firmness",
  "eye_bag",
  "age_spot",
  "tear_trough",
  "droopy_upper_eyelid",
  "droopy_lower_eyelid",
] as const;

function makeResult() {
  return {
    data: {
      results: {
        output: [
          ...METRICS.map((type, index) => ({ type, raw_score: index + 0.5 })),
          { type: "skin_type", region: "whole", skin_type: "Normal" },
          { type: "all", score: 88 },
          { type: "skin_age", score: 30 },
          { type: "resize_image", mask_urls: ["https://example.com/image.jpg"] },
        ],
      },
    },
  };
}

describe("parseYouCamResult", () => {
  it("extracts exactly the 15 raw scores and ignores non-score entries", () => {
    const scores = parseYouCamResult(makeResult());

    expect(scores).toEqual(
      Object.fromEntries(METRICS.map((metric, index) => [metric, index + 0.5])),
    );
    expect(Object.keys(scores)).toHaveLength(15);
  });

  it("rejects a result that omits a required metric", () => {
    const result = makeResult();
    result.data.results.output = result.data.results.output.filter(
      (entry) => entry.type !== "moisture",
    );

    expect(() => parseYouCamResult(result)).toThrow("moisture");
  });
});
