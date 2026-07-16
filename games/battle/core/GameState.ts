import {
  battleReducer,
  createBattleState,
  getAvailableStats,
  type BattlePlayer,
  type BattleState,
} from "@/lib/engine/battle";
import {
  playNpcTurn,
  type NpcStrategy,
  type RandomSource,
} from "@/lib/engine/npc";
import type { Card, StatKey } from "@/lib/engine/types";

class BattleGameState {
  private current: BattleState | null = null;

  reset(cardA: Card, cardB: Card): BattleState {
    this.current = createBattleState(cardA, cardB);
    return this.current;
  }

  get match(): BattleState {
    if (!this.current) {
      throw new Error("Battle state has not been initialized");
    }
    return this.current;
  }

  pick(player: BattlePlayer, pick: StatKey): BattleState {
    this.current = battleReducer(this.match, { type: "pick", player, pick });
    return this.current;
  }

  pickNpc(
    strategy: NpcStrategy,
    rng: RandomSource = Math.random,
  ): BattleState {
    this.current = playNpcTurn(this.match, strategy, rng);
    return this.current;
  }

  available(player: BattlePlayer): StatKey[] {
    return getAvailableStats(this.match, player);
  }
}

export const gameState = new BattleGameState();
