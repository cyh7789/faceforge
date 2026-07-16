import { describe, expect, it } from "vitest";

import {
  APPRENTICE_MOCHI,
  GRIMACE_MASTER,
} from "@/lib/engine/presets";
import {
  InMemoryRoomStore,
  RoomFullError,
  RoomNotFoundError,
  RoomUnauthorizedError,
} from "./store";

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

  it("checks code collisions and joins exactly one opponent", async () => {
    const codes = ["1234", "1234", "5678"];
    const tokens = ["first-p1", "second-p1", "first-p2"];
    const store = new InMemoryRoomStore({
      randomCode: () => codes.shift() ?? "9999",
      randomToken: () => tokens.shift() ?? "later-token",
    });

    const first = await store.create(APPRENTICE_MOCHI);
    const second = await store.create(APPRENTICE_MOCHI);
    const joined = await store.join(first.code, GRIMACE_MASTER);
    const room = await store.get(first.code, joined.playerToken);

    expect(second.code).toBe("5678");
    expect(joined).toEqual({ code: "1234", playerToken: "first-p2" });
    expect(room.players.B?.card).toEqual(GRIMACE_MASTER);
    expect(room.battle).toMatchObject({
      phase: "pickA",
      cards: { A: APPRENTICE_MOCHI, B: GRIMACE_MASTER },
    });
    await expect(
      store.join(first.code, APPRENTICE_MOCHI),
    ).rejects.toBeInstanceOf(RoomFullError);
  });

  it("rejects unknown rooms and wrong player tokens", async () => {
    const store = new InMemoryRoomStore({
      randomCode: () => "1234",
      randomToken: () => "p1-secret",
    });
    const { code } = await store.create(APPRENTICE_MOCHI);

    await expect(store.get("9999", "p1-secret")).rejects.toBeInstanceOf(
      RoomNotFoundError,
    );
    await expect(store.get(code, "wrong-secret")).rejects.toBeInstanceOf(
      RoomUnauthorizedError,
    );
  });

  it("slides the ten-minute TTL on activity and sweeps expired rooms", async () => {
    let now = 1_000;
    const store = new InMemoryRoomStore({
      now: () => now,
      randomCode: () => "1234",
      randomToken: () => "p1-secret",
    });
    const credentials = await store.create(APPRENTICE_MOCHI);

    now = 501_000;
    const active = await store.get(credentials.code, credentials.playerToken);
    expect(active.expiresAt).toBe(1_101_000);

    now = 1_101_001;
    expect(await store.expire()).toBe(1);
    await expect(
      store.get(credentials.code, credentials.playerToken),
    ).rejects.toBeInstanceOf(RoomNotFoundError);
  });
});
