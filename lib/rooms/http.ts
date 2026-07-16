import { BATTLE_STATS } from "@/lib/engine/battle";
import { RAW_METRICS, type Card, type StatKey } from "@/lib/engine/types";
import {
  OpponentConnectedError,
  RoomFullError,
  RoomNotFoundError,
  RoomUnauthorizedError,
  RoomWaitingError,
} from "./store";

export class RoomRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isCard(value: unknown): value is Card {
  if (!isObject(value) || !isObject(value.class) || !isObject(value.stats)) {
    return false;
  }
  if (!isObject(value.talent) || !isObject(value.curse) || !isObject(value.rawScores)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.class.key === "string" &&
    typeof value.class.name === "string" &&
    typeof value.class.nameEn === "string" &&
    typeof value.class.flavor === "string" &&
    (value.rarity === "common" ||
      value.rarity === "rare" ||
      value.rarity === "legendary") &&
    typeof value.weirdness === "number" &&
    BATTLE_STATS.every((stat) => Number.isFinite(value.stats[stat])) &&
    typeof value.talent.metric === "string" &&
    typeof value.talent.name === "string" &&
    typeof value.curse.metric === "string" &&
    typeof value.curse.name === "string" &&
    typeof value.curse.score === "number" &&
    RAW_METRICS.every((metric) => Number.isFinite(value.rawScores[metric])) &&
    value.maskUrl === null &&
    typeof value.roast === "string"
  );
}

export async function requestBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (!isObject(body)) {
      throw new Error("Body is not an object");
    }
    return body;
  } catch {
    throw new RoomRequestError("INVALID_REQUEST", "Invalid JSON request");
  }
}

export function requestedCard(body: Record<string, unknown>): Card {
  if (!isCard(body.card)) {
    throw new RoomRequestError("INVALID_CARD", "A valid card is required");
  }
  return body.card;
}

export function requestedToken(body: Record<string, unknown>): string {
  if (typeof body.token !== "string" || body.token.length === 0) {
    throw new RoomRequestError("INVALID_TOKEN", "A player token is required");
  }
  return body.token;
}

export function requestedPick(body: Record<string, unknown>): StatKey {
  if (!BATTLE_STATS.includes(body.pick as StatKey)) {
    throw new RoomRequestError("INVALID_STAT", "Pick a valid battle stat");
  }
  return body.pick as StatKey;
}

export function roomErrorResponse(error: unknown): Response {
  if (error instanceof RoomRequestError) {
    return Response.json(
      { error: error.code, message: error.message },
      { status: error.status },
    );
  }
  if (error instanceof RoomNotFoundError) {
    return Response.json(
      { error: "ROOM_NOT_FOUND", message: error.message },
      { status: 404 },
    );
  }
  if (error instanceof RoomUnauthorizedError) {
    return Response.json(
      { error: "UNAUTHORIZED", message: error.message },
      { status: 401 },
    );
  }
  if (error instanceof RoomFullError) {
    return Response.json(
      { error: "ROOM_FULL", message: error.message },
      { status: 409 },
    );
  }
  if (error instanceof RoomWaitingError) {
    return Response.json(
      { error: "ROOM_WAITING", message: error.message },
      { status: 409 },
    );
  }
  if (error instanceof OpponentConnectedError) {
    return Response.json(
      { error: "OPPONENT_CONNECTED", message: error.message },
      { status: 409 },
    );
  }
  if (error instanceof Error && error.message.startsWith("Expected player")) {
    return Response.json(
      { error: "OUT_OF_TURN", message: error.message },
      { status: 409 },
    );
  }
  if (error instanceof Error && error.message.includes("already used")) {
    return Response.json(
      { error: "STAT_USED", message: error.message },
      { status: 409 },
    );
  }
  if (error instanceof Error && error.message === "Battle is complete") {
    return Response.json(
      { error: "BATTLE_COMPLETE", message: error.message },
      { status: 409 },
    );
  }
  return Response.json(
    { error: "INTERNAL_ERROR", message: "Unable to update the room" },
    { status: 500 },
  );
}
