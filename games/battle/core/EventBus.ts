import Phaser from "phaser";

export const EventBus = new Phaser.Events.EventEmitter();

export const Events = {
  BATTLE_STATE_CHANGED: "battle:state-changed",
  BATTLE_COMPLETE: "battle:complete",
  SPECTACLE_ENTRANCE: "spectacle:entrance",
  SPECTACLE_ACTION: "spectacle:action",
  SPECTACLE_HIT: "spectacle:hit",
  SPECTACLE_VICTORY: "spectacle:victory",
} as const;
