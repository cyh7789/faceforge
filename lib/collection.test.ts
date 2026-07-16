import { describe, expect, it } from "vitest";

import { addCard, bestCardForClass } from "./collection";
import type { Card, Rarity } from "./engine/types";

function card(id: string, rarity: Rarity = "common"): Card {
  return {
    id,
    class: {
      key: "dry_mage",
      name: "乾燥大法師",
      nameEn: "Dry Mage",
      flavor: "Test flavor",
    },
    rarity,
    weirdness: 10,
    stats: { hp: 1, mp: 2, def: 3, agi: 4, luk: 5, grit: 6 },
    talent: { metric: "moisture", name: "水潤結界" },
    curse: { metric: "moisture", name: "水潤", score: 10 },
    rawScores: {
      oiliness: 50,
      moisture: 10,
      acne: 50,
      radiance: 50,
      wrinkle: 50,
      dark_circle_v2: 50,
      redness: 50,
      pore: 50,
      texture: 50,
      firmness: 50,
      eye_bag: 50,
      age_spot: 50,
      tear_trough: 50,
      droopy_upper_eyelid: 50,
      droopy_lower_eyelid: 50,
    },
    maskUrl: null,
    roast: "Test roast",
  };
}

describe("addCard", () => {
  it("adds a new card without mutating the existing collection", () => {
    const original = [card("first")];

    const next = addCard(original, card("second"));

    expect(next.map(({ id }) => id)).toEqual(["first", "second"]);
    expect(original.map(({ id }) => id)).toEqual(["first"]);
  });

  it("deduplicates cards by deterministic card id", () => {
    const original = [card("same", "rare")];

    const next = addCard(original, card("same", "legendary"));

    expect(next).toBe(original);
    expect(next).toHaveLength(1);
    expect(next[0]?.rarity).toBe("rare");
  });

  it("keeps distinct cards from the same class", () => {
    const next = addCard([card("first")], card("second", "rare"));

    expect(next).toHaveLength(2);
  });
});

describe("bestCardForClass", () => {
  it("selects the highest rarity and the newest card on a tie", () => {
    const olderRare = card("older-rare", "rare");
    const legendary = card("legendary", "legendary");
    const newerLegendary = card("newer-legendary", "legendary");

    expect(
      bestCardForClass(
        [olderRare, legendary, newerLegendary],
        "dry_mage",
      ),
    ).toBe(newerLegendary);
  });
});
