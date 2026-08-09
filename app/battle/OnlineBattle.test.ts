import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  APPRENTICE_MOCHI,
  GRIMACE_MASTER,
} from "@/lib/engine/presets";
import type { BattleRound } from "@/lib/engine/battle";
import type { OnlineRoomView } from "@/lib/rooms/view";
import {
  nextRoundToAnimate,
  OnlineBattleScreen,
  onlineRoomErrorMessage,
} from "./OnlineBattle";

vi.mock("next/image", () => ({
  default: () => null,
}));

const ROUND: BattleRound = {
  round: 1,
  picks: { A: "hp", B: "mp" },
  values: { A: 80, B: 70 },
  winner: "A",
};

function view(overrides: Partial<OnlineRoomView> = {}): OnlineRoomView {
  return {
    code: "1234",
    player: "A",
    phase: "pickA",
    cards: { A: APPRENTICE_MOCHI, B: GRIMACE_MASTER },
    turn: "A",
    youPicked: false,
    opponentPicked: false,
    score: { A: 0, B: 0 },
    availableStats: ["hp", "mp", "def", "agi", "luk", "grit"],
    rounds: [],
    winner: null,
    winReason: null,
    opponentPresent: true,
    canForfeit: false,
    ...overrides,
  };
}

function render(room: OnlineRoomView, revealedRound: BattleRound | null = null, error = "") {
  return renderToStaticMarkup(
    createElement(OnlineBattleScreen, {
      room,
      revealedRound,
      pending: false,
      error,
      onPick: vi.fn(),
      onForfeit: vi.fn(),
      onLeave: vi.fn(),
    }),
  );
}

describe("online battle polling UX", () => {
  it("animates only a newly resolved round", () => {
    expect(nextRoundToAnimate(0, [ROUND])).toBe(ROUND);
    expect(nextRoundToAnimate(1, [ROUND])).toBeNull();
  });

  it("shows the large room code while Player 1 waits for an opponent", () => {
    const html = render(
      view({
        phase: "waiting",
        cards: { A: APPRENTICE_MOCHI, B: null },
        turn: null,
        opponentPresent: false,
      }),
    );

    expect(html).toContain("Waiting for Player 2");
    expect(html).toContain("1234");
    expect(html).not.toContain("Claim Forfeit");
  });

  it("shows thinking, reveal, disconnect, forfeit, and draw states", () => {
    const thinking = render(
      view({ phase: "pickB", turn: "B", youPicked: true }),
    );
    expect(thinking).toContain("Opponent is choosing");
    expect(thinking).toContain("...");

    const reveal = render(view({ rounds: [ROUND] }), ROUND);
    expect(reveal).toContain("REVEAL!");
    expect(reveal).toContain("HP");
    expect(reveal).toContain("MP");

    const disconnected = render(
      view({ opponentPresent: false, canForfeit: true }),
    );
    expect(disconnected).toContain("Opponent disconnected");
    expect(disconnected).toContain("Claim Forfeit");

    const forfeited = render(
      view({
        phase: "complete",
        turn: null,
        winner: "A",
        winReason: "forfeit",
      }),
    );
    expect(forfeited).toContain("You Win!");
    expect(forfeited).toContain("Win by forfeit");
    expect(forfeited).toContain(
      "Opponent disconnected, you take this round.",
    );

    const draw = render(
      view({ phase: "complete", turn: null, winner: "draw" }),
    );
    expect(draw).toContain("Draw!");
  });

  it("maps full, missing, and expired room errors to actionable copy", () => {
    expect(onlineRoomErrorMessage("ROOM_FULL")).toContain("Room full");
    expect(onlineRoomErrorMessage("ROOM_NOT_FOUND")).toContain(
      "Room not found",
    );
    expect(onlineRoomErrorMessage("ROOM_EXPIRED")).toContain(
      "Room expired",
    );
  });

  it("gives an in-room error a clear route back to the lobby", () => {
    const html = render(
      view(),
      null,
      onlineRoomErrorMessage("ROOM_EXPIRED"),
    );

    expect(html).toContain("Room expired");
    expect(html).toContain("Back to Lobby");
  });
});
