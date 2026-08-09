import { createElement, useState } from "react";
import type { AnchorHTMLAttributes } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BattleState } from "@/lib/engine/battle";
import {
  APPRENTICE_MOCHI,
  GRIMACE_MASTER,
} from "@/lib/engine/presets";
import BattleGame, { BattleModePicker } from "./BattleGame";

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
      createElement("a", props, children),
  };
});

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useState: vi.fn(actual.useState) };
});

const DRAW_RESULT = {
  cards: { A: APPRENTICE_MOCHI, B: GRIMACE_MASTER },
  phase: "complete",
  score: { A: 1, B: 1 },
  usedStats: {
    A: ["hp", "mp", "def", "agi", "luk", "grit"],
    B: ["hp", "mp", "def", "agi", "luk", "grit"],
  },
  pendingPick: null,
  rounds: [],
  winner: "draw",
} as unknown as BattleState;

describe("BattleGame result overlay", () => {
  beforeEach(() => {
    vi.mocked(useState).mockReset();
  });

  it("renders Draw! with mirror roasts for both players and unchanged actions", () => {
    vi.mocked(useState)
      .mockReturnValueOnce([[APPRENTICE_MOCHI], vi.fn()])
      .mockReturnValueOnce([true, vi.fn()])
      .mockReturnValueOnce(["quick", vi.fn()])
      .mockReturnValueOnce([{ A: APPRENTICE_MOCHI }, vi.fn()])
      .mockReturnValueOnce([GRIMACE_MASTER, vi.fn()])
      .mockReturnValueOnce(["A", vi.fn()])
      .mockReturnValueOnce([false, vi.fn()])
      .mockReturnValueOnce([true, vi.fn()])
      .mockReturnValueOnce([DRAW_RESULT, vi.fn()])
      .mockReturnValueOnce([0, vi.fn()]);

    const html = renderToStaticMarkup(createElement(BattleGame));

    expect(html).toContain("Draw!");
    expect(html).toContain(`roast for ${APPRENTICE_MOCHI.name}`);
    expect(html).toContain(APPRENTICE_MOCHI.curse.name);
    expect(html).toContain(`roast for ${GRIMACE_MASTER.name}`);
    expect(html).toContain(GRIMACE_MASTER.curse.name);
    expect(html).toContain("Rematch");
    expect(html).toContain("Change Cards");
    expect(html).toContain("Home");
  });
});

describe("BattleGame mode picker", () => {
  it("offers Online Room as the third battle mode", () => {
    const html = renderToStaticMarkup(
      createElement(BattleModePicker, {
        mode: "online",
        onChange: vi.fn(),
      }),
    );

    expect(html).toContain("Online Room");
    expect(html).toContain("Connect two phones");
    expect(html).toContain('aria-pressed="true"');
  });
});
