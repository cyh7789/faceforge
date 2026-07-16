import {
  battleReducer,
  createBattleState,
  type BattlePlayer,
  type BattleState,
} from "@/lib/engine/battle";
import type { Card, StatKey } from "@/lib/engine/types";

export const ROOM_TTL_MS = 10 * 60 * 1_000;
export const PLAYER_DISCONNECTED_MS = 30 * 1_000;

export interface RoomPlayerState {
  token: string;
  card: Card;
  lastSeenAt: number;
}

export interface RoomState {
  code: string;
  players: {
    A: RoomPlayerState;
    B: RoomPlayerState | null;
  };
  battle: BattleState | null;
  winReason: "battle" | "forfeit" | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface RoomCredentials {
  code: string;
  playerToken: string;
}

export type RoomUpdateAction =
  | { type: "pick"; pick: StatKey }
  | { type: "forfeit" };

export interface RoomStore {
  create(card: Card): Promise<RoomCredentials>;
  get(code: string, token: string): Promise<RoomState>;
  join(code: string, card: Card): Promise<RoomCredentials>;
  update(
    code: string,
    token: string,
    action: RoomUpdateAction,
  ): Promise<RoomState>;
  expire(now?: number): Promise<number>;
}

export interface InMemoryRoomStoreOptions {
  now?: () => number;
  randomCode?: () => string;
  randomToken?: () => string;
}

export class RoomNotFoundError extends Error {
  constructor() {
    super("Room not found");
  }
}

export class RoomUnauthorizedError extends Error {
  constructor() {
    super("Invalid player token");
  }
}

export class RoomFullError extends Error {
  constructor() {
    super("Room is full");
  }
}

export class RoomWaitingError extends Error {
  constructor() {
    super("Waiting for an opponent");
  }
}

export class OpponentConnectedError extends Error {
  constructor() {
    super("Opponent is still connected");
  }
}

export function roomPlayerForToken(
  room: RoomState,
  token: string,
): BattlePlayer | null {
  if (room.players.A.token === token) {
    return "A";
  }
  return room.players.B?.token === token ? "B" : null;
}

export class InMemoryRoomStore implements RoomStore {
  private readonly rooms = new Map<string, RoomState>();
  private readonly now: () => number;
  private readonly randomCode: () => string;
  private readonly randomToken: () => string;

  constructor(options: InMemoryRoomStoreOptions = {}) {
    this.now = options.now ?? Date.now;
    this.randomCode =
      options.randomCode ??
      (() => String(1_000 + Math.floor(Math.random() * 9_000)));
    this.randomToken = options.randomToken ?? (() => crypto.randomUUID());
  }

  async create(card: Card): Promise<RoomCredentials> {
    const now = this.now();
    await this.expire(now);
    let code: string | null = null;
    for (let attempt = 0; attempt < 9_000; attempt += 1) {
      const candidate = this.randomCode();
      if (!this.rooms.has(candidate)) {
        code = candidate;
        break;
      }
    }
    if (code === null) {
      throw new Error("No room codes available");
    }
    const playerToken = this.randomToken();
    const room: RoomState = {
      code,
      players: {
        A: { token: playerToken, card, lastSeenAt: now },
        B: null,
      },
      battle: null,
      winReason: null,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + ROOM_TTL_MS,
    };
    this.rooms.set(code, room);
    return { code, playerToken };
  }

  async get(code: string, token: string): Promise<RoomState> {
    const now = this.now();
    await this.expire(now);
    const room = this.rooms.get(code);
    if (!room) {
      throw new RoomNotFoundError();
    }

    const player = roomPlayerForToken(room, token);
    if (!player) {
      throw new RoomUnauthorizedError();
    }

    room.players[player]!.lastSeenAt = now;
    room.updatedAt = now;
    room.expiresAt = now + ROOM_TTL_MS;
    return structuredClone(room);
  }

  async join(code: string, card: Card): Promise<RoomCredentials> {
    const now = this.now();
    await this.expire(now);
    const room = this.rooms.get(code);
    if (!room) {
      throw new RoomNotFoundError();
    }
    if (room.players.B) {
      throw new RoomFullError();
    }

    const playerToken = this.randomToken();
    room.players.B = { token: playerToken, card, lastSeenAt: now };
    room.battle = createBattleState(room.players.A.card, card);
    room.updatedAt = now;
    room.expiresAt = now + ROOM_TTL_MS;
    return { code, playerToken };
  }

  async update(
    code: string,
    token: string,
    action: RoomUpdateAction,
  ): Promise<RoomState> {
    const now = this.now();
    await this.expire(now);
    const room = this.rooms.get(code);
    if (!room) {
      throw new RoomNotFoundError();
    }
    const player = roomPlayerForToken(room, token);
    if (!player) {
      throw new RoomUnauthorizedError();
    }
    if (!room.battle || !room.players.B) {
      throw new RoomWaitingError();
    }

    room.players[player]!.lastSeenAt = now;
    room.updatedAt = now;
    room.expiresAt = now + ROOM_TTL_MS;

    if (action.type === "pick") {
      room.battle = battleReducer(room.battle, {
        type: "pick",
        player,
        pick: action.pick,
      });
      if (room.battle.phase === "complete") {
        room.winReason = "battle";
      }
      return structuredClone(room);
    }

    if (room.battle.phase === "complete") {
      throw new Error("Battle is complete");
    }
    const opponent: BattlePlayer = player === "A" ? "B" : "A";
    if (now - room.players[opponent]!.lastSeenAt < PLAYER_DISCONNECTED_MS) {
      throw new OpponentConnectedError();
    }
    room.battle = {
      ...room.battle,
      phase: "complete",
      pendingPick: null,
      winner: player,
    };
    room.winReason = "forfeit";
    return structuredClone(room);
  }

  async expire(now = this.now()): Promise<number> {
    let expired = 0;
    for (const [code, room] of this.rooms) {
      if (room.expiresAt <= now) {
        this.rooms.delete(code);
        expired += 1;
      }
    }
    return expired;
  }
}
