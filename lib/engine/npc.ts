import {
  BATTLE_STATS,
  battleReducer,
  type BattleState,
} from "./battle";
import type { Card, StatKey } from "./types";

export type NpcStrategy = "apprentice" | "master";
export type RandomSource = () => number;

export function pickNpcStat(
  strategy: NpcStrategy,
  card: Card,
  usedStats: readonly StatKey[],
  rng: RandomSource = Math.random,
): StatKey {
  const available = BATTLE_STATS.filter((stat) => !usedStats.includes(stat));
  if (available.length === 0) {
    throw new Error("NPC has no available stats");
  }

  if (strategy === "apprentice") {
    return available[Math.floor(rng() * available.length)];
  }

  return available.reduce((best, stat) =>
    card.stats[stat] > card.stats[best] ? stat : best,
  );
}

export function playNpcTurn(
  state: BattleState,
  strategy: NpcStrategy,
  rng: RandomSource = Math.random,
): BattleState {
  const pick = pickNpcStat(strategy, state.cards.B, state.usedStats.B, rng);
  return battleReducer(state, { type: "pick", player: "B", pick });
}
