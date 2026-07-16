import { describe, expect, it } from "vitest";

import neutralFixture from "@/fixtures/face-neutral_grimace_sd.json";
import { battleReducer, createBattleState } from "./battle";
import { buildCard } from "./card";
import { pickNpcStat, playNpcTurn } from "./npc";
import { parseYouCamResult } from "./parse";
import { APPRENTICE_MOCHI, GRIMACE_MASTER } from "./presets";

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe("pickNpcStat", () => {
  it("uses injected seeded randomness for Apprentice's uniform pick", () => {
    const first = seededRandom(42);
    const second = seededRandom(42);
    const firstSequence = Array.from({ length: 6 }, () =>
      pickNpcStat("apprentice", APPRENTICE_MOCHI, ["hp"], first),
    );
    const secondSequence = Array.from({ length: 6 }, () =>
      pickNpcStat("apprentice", APPRENTICE_MOCHI, ["hp"], second),
    );

    expect(firstSequence).toEqual(secondSequence);
    expect(firstSequence).not.toContain("hp");
  });

  it("maps Apprentice's random range uniformly across unused stats", () => {
    expect(
      pickNpcStat("apprentice", APPRENTICE_MOCHI, ["hp", "mp"], () => 0),
    ).toBe("def");
    expect(
      pickNpcStat(
        "apprentice",
        APPRENTICE_MOCHI,
        ["hp", "mp"],
        () => 0.999_999,
      ),
    ).toBe("grit");
  });

  it("makes Master greedily pick its highest remaining stat", () => {
    expect(pickNpcStat("master", GRIMACE_MASTER, [], () => 0)).toBe("luk");
    expect(
      pickNpcStat("master", GRIMACE_MASTER, ["luk"], () => 0),
    ).toBe("mp");
    expect(
      pickNpcStat("master", GRIMACE_MASTER, ["luk", "mp"], () => 0),
    ).toBe("def");
  });
});

describe("playNpcTurn", () => {
  it("runs the quick-match reducer path and excludes the NPC's used stats", () => {
    const playerCard = buildCard(parseYouCamResult(neutralFixture));
    let state = createBattleState(playerCard, GRIMACE_MASTER);

    state = battleReducer(state, { type: "pick", player: "A", pick: "hp" });
    state = playNpcTurn(state, "master", () => 0);

    expect(state.rounds[0]?.picks.B).toBe("luk");
    expect(state.usedStats.B).toEqual(["luk"]);

    state = battleReducer(state, { type: "pick", player: "A", pick: "mp" });
    state = playNpcTurn(state, "master", () => 0);

    expect(state.rounds[1]?.picks.B).toBe("mp");
    expect(state.usedStats.B).toEqual(["luk", "mp"]);
  });
});
