import { describe, expect, it } from "vitest";

import { spinBattle } from "./battle";
import type { Card, Stats } from "./types";

function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function card(id: string, stats: Stats): Card {
  return {
    id,
    class: {
      key: "dry_mage",
      name: "乾燥大法師",
      nameEn: "Dry Mage",
      flavor: "test",
    },
    rarity: "common",
    weirdness: 0,
    stats,
    talent: { metric: "moisture", name: "水潤結界" },
    curse: { metric: "moisture", name: "水潤", score: 10 },
    rawScores: {
      oiliness: 50,
      moisture: 50,
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
    roast: "test",
  };
}

const HIGH: Stats = { hp: 90, mp: 90, def: 90, agi: 90, luk: 90, grit: 90 };
const LOW: Stats = { hp: 10, mp: 10, def: 10, agi: 10, luk: 10, grit: 10 };

describe("spinBattle", () => {
  it("ends when card A wins two rounds", () => {
    const result = spinBattle(card("A", HIGH), card("B", LOW), seededRng(7));

    expect(result.winner).toBe("A");
    expect(result.score).toEqual({ cardA: 2, cardB: 0 });
    expect(result.rounds).toHaveLength(2);
  });

  it("ends when card B wins two rounds", () => {
    const result = spinBattle(card("A", LOW), card("B", HIGH), seededRng(19));

    expect(result.winner).toBe("B");
    expect(result.score).toEqual({ cardA: 0, cardB: 2 });
  });

  it("records a tie and respins without awarding the round", () => {
    const cardA = card("A", { ...HIGH, mp: 50 });
    const cardB = card("B", { ...LOW, mp: 50 });

    const result = spinBattle(cardA, cardB, seededRng(1));

    expect(result.rounds.map(({ stat, winner }) => ({ stat, winner }))).toEqual([
      { stat: "mp", winner: "tie" },
      { stat: "def", winner: "A" },
      { stat: "agi", winner: "A" },
    ]);
    expect(result.rounds.map((round) => round.round)).toEqual([1, 1, 2]);
    expect(result.score).toEqual({ cardA: 2, cardB: 0 });
  });
});
