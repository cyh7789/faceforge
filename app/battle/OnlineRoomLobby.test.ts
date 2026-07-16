import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { APPRENTICE_MOCHI } from "@/lib/engine/presets";
import { OnlineRoomControls } from "./OnlineRoomLobby";

describe("OnlineRoomControls", () => {
  it("creates or joins with the player's selected card and a numeric room code", () => {
    const html = renderToStaticMarkup(
      createElement(OnlineRoomControls, {
        card: APPRENTICE_MOCHI,
        joinCode: "1234",
        pending: false,
        error: "",
        onJoinCodeChange: vi.fn(),
        onCreate: vi.fn(),
        onJoin: vi.fn(),
      }),
    );

    expect(html).toContain("Create Room");
    expect(html).toContain("Join Room");
    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('value="1234"');
    expect(html).toContain(APPRENTICE_MOCHI.nameEn);
  });

  it("keeps room actions disabled until a card is selected", () => {
    const html = renderToStaticMarkup(
      createElement(OnlineRoomControls, {
        joinCode: "",
        pending: false,
        error: "Room not found",
        onJoinCodeChange: vi.fn(),
        onCreate: vi.fn(),
        onJoin: vi.fn(),
      }),
    );

    expect(html).toContain("Pick your hero above first");
    expect(html).toContain("Room not found");
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });

  it("offers an explicit new-room recovery action after a join error", () => {
    const html = renderToStaticMarkup(
      createElement(OnlineRoomControls, {
        card: APPRENTICE_MOCHI,
        joinCode: "9999",
        pending: false,
        error: "找不到房間 · Room not found",
        onJoinCodeChange: vi.fn(),
        onCreate: vi.fn(),
        onJoin: vi.fn(),
      }),
    );

    expect(html).toContain("找不到房間 · Room not found");
    expect(html).toContain("建立新房 · Create New Room");
  });
});
