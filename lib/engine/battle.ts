import type { Card, StatKey } from "./types";

export const BATTLE_STATS: readonly StatKey[] = [
  "hp",
  "mp",
  "def",
  "agi",
  "luk",
  "grit",
];

export type BattleRoundWinner = "A" | "B" | "tie";

export interface BattleRound {
  round: number;
  stat: StatKey;
  cardA: number;
  cardB: number;
  winner: BattleRoundWinner;
}

export interface BattleResult {
  winner: "A" | "B";
  score: {
    cardA: number;
    cardB: number;
  };
  rounds: BattleRound[];
}

export function spinBattle(cardA: Card, cardB: Card, rng: () => number): BattleResult {
  let cardAWins = 0;
  let cardBWins = 0;
  const rounds: BattleRound[] = [];

  while (cardAWins < 2 && cardBWins < 2) {
    const stat = BATTLE_STATS[Math.floor(rng() * BATTLE_STATS.length)];
    const valueA = cardA.stats[stat];
    const valueB = cardB.stats[stat];
    const round = cardAWins + cardBWins + 1;

    if (valueA === valueB) {
      rounds.push({ round, stat, cardA: valueA, cardB: valueB, winner: "tie" });
      continue;
    }

    const winner = valueA > valueB ? "A" : "B";
    if (winner === "A") {
      cardAWins += 1;
    } else {
      cardBWins += 1;
    }
    rounds.push({ round, stat, cardA: valueA, cardB: valueB, winner });
  }

  return {
    winner: cardAWins === 2 ? "A" : "B",
    score: { cardA: cardAWins, cardB: cardBWins },
    rounds,
  };
}
