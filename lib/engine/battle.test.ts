import { describe, expect, it } from "vitest";

import {
  BATTLE_STATS,
  battleReducer,
  createBattleState,
  getAvailableStats,
  resolveTurn,
} from "./battle";
import type { Card, Stats } from "./types";

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

const CARD_A = card("A", {
  hp: 90,
  mp: 20,
  def: 70,
  agi: 30,
  luk: 50,
  grit: 40,
});
const CARD_B = card("B", {
  hp: 10,
  mp: 80,
  def: 60,
  agi: 30,
  luk: 50,
  grit: 90,
});

function pickA(state: ReturnType<typeof createBattleState>, pick: keyof Stats) {
  return battleReducer(state, { type: "pick", player: "A", pick });
}

function pickB(state: ReturnType<typeof createBattleState>, pick: keyof Stats) {
  return battleReducer(state, { type: "pick", player: "B", pick });
}

describe("resolveTurn", () => {
  it("returns player A and both values when A's picked value is higher", () => {
    expect(
      resolveTurn(
        { card: CARD_A, pick: "hp" },
        { card: CARD_B, pick: "mp" },
      ),
    ).toEqual({ winner: "A", values: { A: 90, B: 80 } });
  });

  it("returns player B when B's picked value is higher", () => {
    expect(
      resolveTurn(
        { card: CARD_A, pick: "mp" },
        { card: CARD_B, pick: "grit" },
      ).winner,
    ).toBe("B");
  });

  it("returns a tie when the independently picked values match", () => {
    expect(
      resolveTurn(
        { card: CARD_A, pick: "agi" },
        { card: CARD_B, pick: "agi" },
      ),
    ).toEqual({ winner: "tie", values: { A: 30, B: 30 } });
  });
});

describe("battleReducer", () => {
  it("creates a clean first-to-two match", () => {
    const state = createBattleState(CARD_A, CARD_B);

    expect(state).toMatchObject({
      phase: "pickA",
      score: { A: 0, B: 0 },
      usedStats: { A: [], B: [] },
      pendingPick: null,
      rounds: [],
      winner: null,
    });
    expect(getAvailableStats(state, "A")).toEqual(BATTLE_STATS);
  });

  it("records P1's pick, excludes it, and waits for P2 without resolving", () => {
    const initial = createBattleState(CARD_A, CARD_B);
    const state = pickA(initial, "hp");

    expect(state.phase).toBe("pickB");
    expect(state.pendingPick).toBe("hp");
    expect(state.usedStats.A).toEqual(["hp"]);
    expect(state.rounds).toEqual([]);
    expect(getAvailableStats(state, "A")).not.toContain("hp");
    expect(initial.usedStats.A).toEqual([]);
  });

  it("resolves both picks, awards A, and advances to the next round", () => {
    const afterA = pickA(createBattleState(CARD_A, CARD_B), "hp");
    const state = pickB(afterA, "mp");

    expect(state.phase).toBe("pickA");
    expect(state.score).toEqual({ A: 1, B: 0 });
    expect(state.usedStats).toEqual({ A: ["hp"], B: ["mp"] });
    expect(state.pendingPick).toBeNull();
    expect(state.rounds).toEqual([
      {
        round: 1,
        picks: { A: "hp", B: "mp" },
        values: { A: 90, B: 80 },
        winner: "A",
      },
    ]);
  });

  it("awards B when B has the higher picked value", () => {
    const afterA = pickA(createBattleState(CARD_A, CARD_B), "mp");
    const state = pickB(afterA, "grit");

    expect(state.score).toEqual({ A: 0, B: 1 });
    expect(state.rounds[0]?.winner).toBe("B");
  });

  it("keeps tied picks used, awards no point, and repeats the round number", () => {
    let state = pickA(createBattleState(CARD_A, CARD_B), "agi");
    state = pickB(state, "agi");

    expect(state.score).toEqual({ A: 0, B: 0 });
    expect(state.usedStats).toEqual({ A: ["agi"], B: ["agi"] });
    expect(state.phase).toBe("pickA");
    expect(state.rounds[0]).toMatchObject({ round: 1, winner: "tie" });

    state = pickA(state, "hp");
    state = pickB(state, "mp");

    expect(state.score).toEqual({ A: 1, B: 0 });
    expect(state.rounds.map(({ round }) => round)).toEqual([1, 1]);
  });

  it("rejects a pick already used by that player", () => {
    let state = pickA(createBattleState(CARD_A, CARD_B), "agi");
    state = pickB(state, "agi");

    expect(() => pickA(state, "agi")).toThrowError(
      "Player A already used agi",
    );
  });

  it("rejects picks made out of turn", () => {
    const state = createBattleState(CARD_A, CARD_B);

    expect(() => pickB(state, "hp")).toThrowError("Expected player A to pick");
  });

  it("finishes immediately when A reaches two wins", () => {
    let state = createBattleState(CARD_A, CARD_B);
    state = pickA(state, "hp");
    state = pickB(state, "mp");
    state = pickA(state, "def");
    state = pickB(state, "def");

    expect(state).toMatchObject({
      phase: "complete",
      score: { A: 2, B: 0 },
      winner: "A",
    });
    expect(state.rounds).toHaveLength(2);
  });

  it("supports a three-round path where B reaches two wins", () => {
    let state = createBattleState(CARD_A, CARD_B);
    state = pickA(state, "hp");
    state = pickB(state, "mp");
    state = pickA(state, "mp");
    state = pickB(state, "grit");
    state = pickA(state, "grit");
    state = pickB(state, "hp");

    expect(state).toMatchObject({
      phase: "complete",
      score: { A: 1, B: 2 },
      winner: "B",
    });
    expect(state.rounds.map(({ winner }) => winner)).toEqual(["A", "B", "B"]);
  });

  it("rejects further input after the match is complete", () => {
    let state = createBattleState(CARD_A, CARD_B);
    state = pickA(state, "hp");
    state = pickB(state, "mp");
    state = pickA(state, "def");
    state = pickB(state, "def");

    expect(() =>
      battleReducer(state, { type: "pick", player: "A", pick: "luk" }),
    ).toThrowError("Battle is complete");
  });
});
