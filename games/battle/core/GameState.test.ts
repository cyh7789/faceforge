import { describe, expect, it } from "vitest";

import neutralFixture from "@/fixtures/face-neutral_grimace_sd.json";
import { buildCard } from "@/lib/engine/card";
import { parseYouCamResult } from "@/lib/engine/parse";
import { GRIMACE_MASTER } from "@/lib/engine/presets";
import { gameState } from "./GameState";

describe("BattleGameState NPC turn", () => {
  it("runs the NPC strategy through the centralized battle state", () => {
    const playerCard = buildCard(parseYouCamResult(neutralFixture));
    gameState.reset(playerCard, GRIMACE_MASTER);

    gameState.pick("A", "hp");
    const state = gameState.pickNpc("master", () => 0);

    expect(state.rounds[0]?.picks).toEqual({ A: "hp", B: "luk" });
    expect(state.usedStats.B).toEqual(["luk"]);
  });
});
