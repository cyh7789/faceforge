import { describe, expect, it } from "vitest";

import { CLASS_BY_WEAKEST, PALADIN } from "./classify";
import { pickRoast, ROAST_LIBRARY } from "./roast";
import type { Curse } from "./types";

const CURSE: Curse = { metric: "pore", name: "Pores", score: 45.2 };

describe("roast library", () => {
  it("contains 3 to 5 lines for every collectible class", () => {
    const classKeys = new Set([
      ...Object.values(CLASS_BY_WEAKEST).map((info) => info.key),
      PALADIN.key,
    ]);

    expect(classKeys.size).toBe(15);
    expect(Object.keys(ROAST_LIBRARY).sort()).toEqual([...classKeys].sort());
    for (const lines of Object.values(ROAST_LIBRARY)) {
      expect(lines.length).toBeGreaterThanOrEqual(3);
      expect(lines.length).toBeLessThanOrEqual(5);
    }
  });

  it("selects and renders a line deterministically from the card id", () => {
    const first = pickRoast("crater_warden", "ff-12345678", CURSE);
    const second = pickRoast("crater_warden", "ff-12345678", CURSE);

    expect(first).toBe(second);
    expect(first).toContain("45");
    expect(first).not.toMatch(/\{(?:score|curse)\}/);
  });
});
