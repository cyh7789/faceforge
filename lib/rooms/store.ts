import type { BattleState } from "@/lib/engine/battle";
import type { Card } from "@/lib/engine/types";

export const ROOM_TTL_MS = 10 * 60 * 1_000;

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

export interface RoomStore {
  create(card: Card): Promise<RoomCredentials>;
  get(code: string, token: string): Promise<RoomState>;
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
    const code = this.randomCode();
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
    const room = this.rooms.get(code);
    if (!room) {
      throw new RoomNotFoundError();
    }

    const now = this.now();
    const player =
      room.players.A.token === token
        ? room.players.A
        : room.players.B?.token === token
          ? room.players.B
          : null;
    if (!player) {
      throw new RoomUnauthorizedError();
    }

    player.lastSeenAt = now;
    room.updatedAt = now;
    room.expiresAt = now + ROOM_TTL_MS;
    return structuredClone(room);
  }
}
