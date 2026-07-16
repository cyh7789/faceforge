import { describe, expect, it } from "vitest";

import {
  battleDestination,
  battleModeFromSearch,
  battleReturnQuery,
} from "./battle-navigation";

describe("battleModeFromSearch", () => {
  it("defaults a fresh battle lobby to Quick Match", () => {
    expect(battleModeFromSearch("")).toBe("quick");
  });

  it("honors an explicit battle mode", () => {
    expect(battleModeFromSearch("?mode=quick&player=B")).toBe("quick");
    expect(battleModeFromSearch("?mode=twoPlayers&player=A")).toBe(
      "twoPlayers",
    );
  });

  it("keeps legacy Player 2 draw returns in 2 Players mode", () => {
    expect(battleModeFromSearch("?player=B&card=ff-returned")).toBe(
      "twoPlayers",
    );
  });
});

describe("battle draw navigation", () => {
  it("preserves Quick Match through draw and reveal", () => {
    const search = "?returnTo=battle&mode=quick&player=A";

    expect(battleReturnQuery(search)).toBe(
      "?returnTo=battle&mode=quick&player=A",
    );
    expect(battleDestination(search, "ff first/card")).toBe(
      "/battle?mode=quick&player=A&card=ff+first%2Fcard",
    );
  });

  it("preserves the existing Player 2 return path", () => {
    const search = "?returnTo=battle&mode=twoPlayers&player=B";

    expect(battleReturnQuery(search)).toBe(
      "?returnTo=battle&mode=twoPlayers&player=B",
    );
    expect(battleDestination(search, "ff-player-two")).toBe(
      "/battle?mode=twoPlayers&player=B&card=ff-player-two",
    );
  });

  it("does not create a battle return for an ordinary draw", () => {
    expect(battleReturnQuery("?source=home")).toBe("");
    expect(battleDestination("?source=home", "ff-card")).toBeNull();
  });
});
