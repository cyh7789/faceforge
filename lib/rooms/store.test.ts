import { describe, expect, it } from "vitest";

import { APPRENTICE_MOCHI } from "@/lib/engine/presets";
import { InMemoryRoomStore } from "./store";

describe("InMemoryRoomStore", () => {
  it("creates a room and authenticates its creator", async () => {
    const store = new InMemoryRoomStore({
      now: () => 1_000,
      randomCode: () => "1234",
      randomToken: () => "p1-secret",
    });

    const credentials = await store.create(APPRENTICE_MOCHI);
    const room = await store.get(credentials.code, credentials.playerToken);

    expect(credentials).toEqual({
      code: "1234",
      playerToken: "p1-secret",
    });
    expect(room).toMatchObject({
      code: "1234",
      battle: null,
      players: {
        A: {
          token: "p1-secret",
          card: APPRENTICE_MOCHI,
          lastSeenAt: 1_000,
        },
        B: null,
      },
      expiresAt: 601_000,
    });
  });
});
