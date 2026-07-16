import type { Card, StatKey } from "./types";

export const BATTLE_STATS: readonly StatKey[] = [
  "hp",
  "mp",
  "def",
  "agi",
  "luk",
  "grit",
];

export type BattlePlayer = "A" | "B";
export type BattleRoundWinner = BattlePlayer | "tie";
export type BattleWinner = BattlePlayer | "draw";
export type BattlePhase = "pickA" | "pickB" | "complete";

export interface TurnPick {
  card: Card;
  pick: StatKey;
}

export interface TurnResult {
  winner: BattleRoundWinner;
  values: Record<BattlePlayer, number>;
}

export interface BattleRound extends TurnResult {
  round: number;
  picks: Record<BattlePlayer, StatKey>;
}

export interface BattleState {
  cards: Record<BattlePlayer, Card>;
  phase: BattlePhase;
  score: Record<BattlePlayer, number>;
  usedStats: Record<BattlePlayer, StatKey[]>;
  pendingPick: StatKey | null;
  rounds: BattleRound[];
  winner: BattleWinner | null;
}

export type BattleAction = {
  type: "pick";
  player: BattlePlayer;
  pick: StatKey;
};

export function resolveTurn(a: TurnPick, b: TurnPick): TurnResult {
  const values = {
    A: a.card.stats[a.pick],
    B: b.card.stats[b.pick],
  };

  if (values.A === values.B) {
    return { winner: "tie", values };
  }

  return {
    winner: values.A > values.B ? "A" : "B",
    values,
  };
}

export function createBattleState(cardA: Card, cardB: Card): BattleState {
  return {
    cards: { A: cardA, B: cardB },
    phase: "pickA",
    score: { A: 0, B: 0 },
    usedStats: { A: [], B: [] },
    pendingPick: null,
    rounds: [],
    winner: null,
  };
}

export function getAvailableStats(
  state: BattleState,
  player: BattlePlayer,
): StatKey[] {
  return BATTLE_STATS.filter((stat) => !state.usedStats[player].includes(stat));
}

export function battleReducer(
  state: BattleState,
  action: BattleAction,
): BattleState {
  if (state.phase === "complete") {
    throw new Error("Battle is complete");
  }

  const expectedPlayer: BattlePlayer = state.phase === "pickA" ? "A" : "B";
  if (action.player !== expectedPlayer) {
    throw new Error(`Expected player ${expectedPlayer} to pick`);
  }

  if (state.usedStats[action.player].includes(action.pick)) {
    throw new Error(`Player ${action.player} already used ${action.pick}`);
  }

  if (action.player === "A") {
    return {
      ...state,
      phase: "pickB",
      usedStats: {
        ...state.usedStats,
        A: [...state.usedStats.A, action.pick],
      },
      pendingPick: action.pick,
    };
  }

  if (state.pendingPick === null) {
    throw new Error("Player A must pick first");
  }

  const result = resolveTurn(
    { card: state.cards.A, pick: state.pendingPick },
    { card: state.cards.B, pick: action.pick },
  );
  const score = { ...state.score };
  if (result.winner !== "tie") {
    score[result.winner] += 1;
  }

  const usedStats = {
    ...state.usedStats,
    B: [...state.usedStats.B, action.pick],
  };
  let winner: BattleWinner | null =
    score.A === 2 ? "A" : score.B === 2 ? "B" : null;
  const statsExhausted = BATTLE_STATS.every(
    (stat) => usedStats.A.includes(stat) && usedStats.B.includes(stat),
  );
  if (winner === null && statsExhausted) {
    if (score.A !== score.B) {
      winner = score.A > score.B ? "A" : "B";
    } else {
      const statSums = {
        A: BATTLE_STATS.reduce(
          (sum, stat) => sum + state.cards.A.stats[stat],
          0,
        ),
        B: BATTLE_STATS.reduce(
          (sum, stat) => sum + state.cards.B.stats[stat],
          0,
        ),
      };
      winner =
        statSums.A === statSums.B
          ? "draw"
          : statSums.A > statSums.B
            ? "A"
            : "B";
    }
  }
  const round: BattleRound = {
    round: state.score.A + state.score.B + 1,
    picks: { A: state.pendingPick, B: action.pick },
    ...result,
  };

  return {
    ...state,
    phase: winner ? "complete" : "pickA",
    score,
    usedStats,
    pendingPick: null,
    rounds: [...state.rounds, round],
    winner,
  };
}
