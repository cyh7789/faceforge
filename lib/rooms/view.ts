import {
  BATTLE_STATS,
  getAvailableStats,
  type BattlePhase,
  type BattlePlayer,
  type BattleRound,
  type BattleWinner,
} from "@/lib/engine/battle";
import type { Card, StatKey } from "@/lib/engine/types";
import {
  PLAYER_DISCONNECTED_MS,
  roomPlayerForToken,
  type RoomState,
} from "./store";

export interface OnlineRoomView {
  code: string;
  player: BattlePlayer;
  phase: BattlePhase | "waiting";
  cards: { A: Card; B: Card | null };
  turn: BattlePlayer | null;
  youPicked: boolean;
  opponentPicked: boolean;
  score: Record<BattlePlayer, number>;
  availableStats: StatKey[];
  rounds: BattleRound[];
  winner: BattleWinner | null;
  winReason: "battle" | "forfeit" | null;
  opponentPresent: boolean;
  canForfeit: boolean;
}

export function roomView(
  room: RoomState,
  token: string,
  now = Date.now(),
): OnlineRoomView {
  const player = roomPlayerForToken(room, token);
  if (!player) {
    throw new Error("Cannot sanitize a room for an unknown player");
  }
  const opponent: BattlePlayer = player === "A" ? "B" : "A";
  const opponentState = room.players[opponent];
  const opponentPresent =
    opponentState !== null &&
    now - opponentState.lastSeenAt < PLAYER_DISCONNECTED_MS;
  const pendingPlayer = room.battle?.phase === "pickB" ? "A" : null;
  const phase = room.battle?.phase ?? "waiting";
  const turn =
    phase === "pickA" ? "A" : phase === "pickB" ? "B" : null;

  return {
    code: room.code,
    player,
    phase,
    cards: {
      A: room.players.A.card,
      B: room.players.B?.card ?? null,
    },
    turn,
    youPicked: pendingPlayer === player,
    opponentPicked: pendingPlayer === opponent,
    score: room.battle?.score ?? { A: 0, B: 0 },
    availableStats: room.battle
      ? getAvailableStats(room.battle, player)
      : [...BATTLE_STATS],
    rounds: room.battle?.rounds ?? [],
    winner: room.battle?.winner ?? null,
    winReason: room.winReason,
    opponentPresent,
    canForfeit:
      room.battle !== null &&
      room.battle.phase !== "complete" &&
      room.players.B !== null &&
      !opponentPresent,
  };
}
