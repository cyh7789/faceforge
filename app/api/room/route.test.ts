import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as pollRoom } from "./[code]/route";
import { POST as actInRoom } from "./[code]/action/route";
import { POST as joinRoom } from "./[code]/join/route";
import { POST as createRoom } from "./route";
import { roomStore } from "@/lib/rooms/server";
import { BATTLE_STATS } from "@/lib/engine/battle";
import {
  APPRENTICE_MOCHI,
  GRIMACE_MASTER,
} from "@/lib/engine/presets";
import type { Card, Stats } from "@/lib/engine/types";

function post(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function context(code: string) {
  return { params: Promise.resolve({ code }) };
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function create(card: Card = APPRENTICE_MOCHI) {
  const response = await createRoom(post("http://localhost/api/room", { card }));
  return {
    response,
    body: await json<{ code: string; playerToken: string }>(response),
  };
}

async function join(code: string, card: Card = GRIMACE_MASTER) {
  const response = await joinRoom(
    post(`http://localhost/api/room/${code}/join`, { card }),
    context(code),
  );
  return {
    response,
    body: await json<{ playerToken: string }>(response),
  };
}

function battleCard(id: string, stats: Stats): Card {
  return {
    ...APPRENTICE_MOCHI,
    id,
    isPreset: undefined,
    stats,
  };
}

describe("online room route handlers", () => {
  beforeEach(() => {
    roomStore.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates, joins, polls, hides the pending pick, and resolves an action", async () => {
    const creator = await create();
    expect(creator.response.status).toBe(201);
    expect(creator.body.code).toMatch(/^\d{4}$/);
    expect(creator.body.playerToken.length).toBeGreaterThan(20);

    const joiner = await join(creator.body.code);
    expect(joiner.response.status).toBe(200);

    const initialResponse = await pollRoom(
      new Request(
        `http://localhost/api/room/${creator.body.code}?token=${creator.body.playerToken}`,
      ),
      context(creator.body.code),
    );
    const initial = await json<Record<string, unknown>>(initialResponse);
    expect(initialResponse.status).toBe(200);
    expect(initial).toMatchObject({
      code: creator.body.code,
      player: "A",
      phase: "pickA",
      turn: "A",
      opponentPicked: false,
      opponentPresent: true,
      score: { A: 0, B: 0 },
      rounds: [],
      winner: null,
    });
    expect(initial.cards).toEqual({
      A: APPRENTICE_MOCHI,
      B: GRIMACE_MASTER,
    });

    const afterAResponse = await actInRoom(
      post(`http://localhost/api/room/${creator.body.code}/action`, {
        token: creator.body.playerToken,
        pick: "hp",
      }),
      context(creator.body.code),
    );
    expect(afterAResponse.status).toBe(200);

    const waitingResponse = await pollRoom(
      new Request(
        `http://localhost/api/room/${creator.body.code}?token=${joiner.body.playerToken}`,
      ),
      context(creator.body.code),
    );
    const waiting = await json<Record<string, unknown>>(waitingResponse);
    expect(waiting).toMatchObject({
      player: "B",
      phase: "pickB",
      turn: "B",
      opponentPicked: true,
      rounds: [],
    });
    expect(waiting).not.toHaveProperty("pendingPick");

    const resolvedResponse = await actInRoom(
      post(`http://localhost/api/room/${creator.body.code}/action`, {
        token: joiner.body.playerToken,
        pick: "mp",
      }),
      context(creator.body.code),
    );
    const resolved = await json<{
      phase: string;
      rounds: Array<{ picks: { A: string; B: string } }>;
    }>(resolvedResponse);
    expect(resolvedResponse.status).toBe(200);
    expect(resolved.phase).toBe("pickA");
    expect(resolved.rounds[0]?.picks).toEqual({ A: "hp", B: "mp" });
  });

  it("rejects wrong tokens, out-of-turn actions, illegal stats, and a third player", async () => {
    const creator = await create();
    const joiner = await join(creator.body.code);

    const wrongToken = await pollRoom(
      new Request(
        `http://localhost/api/room/${creator.body.code}?token=wrong-secret`,
      ),
      context(creator.body.code),
    );
    expect(wrongToken.status).toBe(401);
    await expect(json(wrongToken)).resolves.toMatchObject({
      error: "UNAUTHORIZED",
    });

    const outOfTurn = await actInRoom(
      post(`http://localhost/api/room/${creator.body.code}/action`, {
        token: joiner.body.playerToken,
        pick: "hp",
      }),
      context(creator.body.code),
    );
    expect(outOfTurn.status).toBe(409);
    await expect(json(outOfTurn)).resolves.toMatchObject({
      error: "OUT_OF_TURN",
    });

    const illegalStat = await actInRoom(
      post(`http://localhost/api/room/${creator.body.code}/action`, {
        token: creator.body.playerToken,
        pick: "power",
      }),
      context(creator.body.code),
    );
    expect(illegalStat.status).toBe(400);
    await expect(json(illegalStat)).resolves.toMatchObject({
      error: "INVALID_STAT",
    });

    const full = await join(creator.body.code, APPRENTICE_MOCHI);
    expect(full.response.status).toBe(409);
    expect(full.body).toMatchObject({ error: "ROOM_FULL" });
  });

  it("completes the batch-6 exhausted draw path entirely through API actions", async () => {
    const cardA = battleCard("draw-A", {
      hp: 55,
      mp: 45,
      def: 50,
      agi: 50,
      luk: 50,
      grit: 50,
    });
    const cardB = battleCard("draw-B", {
      hp: 50,
      mp: 50,
      def: 50,
      agi: 50,
      luk: 50,
      grit: 50,
    });
    const creator = await create(cardA);
    const joiner = await join(creator.body.code, cardB);

    for (const pick of BATTLE_STATS) {
      const a = await actInRoom(
        post(`http://localhost/api/room/${creator.body.code}/action`, {
          token: creator.body.playerToken,
          pick,
        }),
        context(creator.body.code),
      );
      expect(a.status).toBe(200);
      const b = await actInRoom(
        post(`http://localhost/api/room/${creator.body.code}/action`, {
          token: joiner.body.playerToken,
          pick,
        }),
        context(creator.body.code),
      );
      expect(b.status).toBe(200);
    }

    const finalResponse = await pollRoom(
      new Request(
        `http://localhost/api/room/${creator.body.code}?token=${creator.body.playerToken}`,
      ),
      context(creator.body.code),
    );
    const final = await json<Record<string, unknown>>(finalResponse);
    expect(final).toMatchObject({
      phase: "complete",
      turn: null,
      score: { A: 1, B: 1 },
      winner: "draw",
      winReason: "battle",
    });
    expect(final.rounds).toHaveLength(6);
  });

  it("allows a stale opponent to be defeated by forfeit", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T01:00:00+08:00"));
    const creator = await create();
    await join(creator.body.code);
    vi.advanceTimersByTime(30_001);

    const response = await actInRoom(
      post(`http://localhost/api/room/${creator.body.code}/action`, {
        token: creator.body.playerToken,
        action: "forfeit",
      }),
      context(creator.body.code),
    );
    const result = await json<Record<string, unknown>>(response);

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      phase: "complete",
      winner: "A",
      winReason: "forfeit",
    });
  });

  it("distinguishes an expired room from an unknown room", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T01:00:00+08:00"));
    const creator = await create();
    vi.advanceTimersByTime(10 * 60 * 1_000 + 1);

    const response = await pollRoom(
      new Request(
        `http://localhost/api/room/${creator.body.code}?token=${creator.body.playerToken}`,
      ),
      context(creator.body.code),
    );

    expect(response.status).toBe(410);
    await expect(json(response)).resolves.toMatchObject({
      error: "ROOM_EXPIRED",
    });
  });
});
