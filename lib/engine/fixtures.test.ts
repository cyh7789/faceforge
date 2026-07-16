import { describe, expect, it } from "vitest";

import frown from "@/fixtures/face-frown_grimace_sd.json";
import neutral from "@/fixtures/face-neutral_grimace_sd.json";
import puff from "@/fixtures/face-puff_grimace_sd.json";
import roar from "@/fixtures/face-roar_grimace_sd.json";
import squint from "@/fixtures/face-squint_grimace_sd.json";
import { buildCard } from "./card";
import { parseYouCamResult } from "./parse";

const CASES = [
  ["neutral", neutral, "乾燥大法師", "common"],
  ["frown", frown, "粗獷遊俠", "rare"],
  ["squint", squint, "垂簾聽政者", "legendary"],
  ["puff", puff, "隕坑守望者", "common"],
  ["roar", roar, "隕坑守望者", "rare"],
] as const;

describe("fixture card pipeline", () => {
  it.each(CASES)(
    "parses %s into the expected valid card",
    (_name, fixture, expectedClass, expectedRarity) => {
      const card = buildCard(parseYouCamResult(fixture));

      expect(card.class.name).toBe(expectedClass);
      expect(card.rarity).toBe(expectedRarity);
      expect(card.id).toMatch(/^ff-[0-9a-f]{8}$/);
      expect(Object.keys(card.rawScores)).toHaveLength(15);
      expect(Object.values(card.stats).every((value) => value >= 1 && value <= 99)).toBe(
        true,
      );
      expect(card.maskUrl).toBeNull();
    },
  );
});
