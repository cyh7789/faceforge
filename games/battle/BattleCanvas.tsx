"use client";

import Phaser from "phaser";
import { useEffect, useRef } from "react";

import type { BattleState } from "@/lib/engine/battle";
import type { NpcStrategy } from "@/lib/engine/npc";
import type { Card } from "@/lib/engine/types";

import { GAME } from "./core/Constants";
import { EventBus, Events } from "./core/EventBus";
import { gameState } from "./core/GameState";
import { BattleScene } from "./scenes/BattleScene";
import styles from "./BattleCanvas.module.css";

declare global {
  interface Window {
    __GAME__?: Phaser.Game;
    __GAME_STATE__?: typeof gameState;
    __EVENT_BUS__?: typeof EventBus;
    __EVENTS__?: typeof Events;
    render_game_to_text?: () => string;
    advanceTime?: (milliseconds: number) => Promise<void>;
  }
}

interface BattleCanvasProps {
  cardA: Card;
  cardB: Card;
  npcStrategy?: NpcStrategy;
  onComplete: (state: BattleState) => void;
}

export default function BattleCanvas({
  cardA,
  cardB,
  npcStrategy,
  onComplete,
}: BattleCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const parent = mountRef.current;
    if (!parent) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gameState.reset(cardA, cardB);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: GAME.WIDTH,
      height: GAME.HEIGHT,
      backgroundColor: GAME.BACKGROUND_COLOR,
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME.WIDTH,
        height: GAME.HEIGHT,
      },
      scene: [new BattleScene(reducedMotion, npcStrategy)],
    });

    const handleComplete = (state: BattleState) => onCompleteRef.current(state);
    EventBus.on(Events.BATTLE_COMPLETE, handleComplete);

    window.__GAME__ = game;
    window.__GAME_STATE__ = gameState;
    window.__EVENT_BUS__ = EventBus;
    window.__EVENTS__ = Events;
    window.render_game_to_text = () => {
      const state = gameState.match;
      const activePlayer = state.phase === "pickA"
        ? "A"
        : state.phase === "pickB"
          ? npcStrategy
            ? "NPC"
            : "B"
          : null;
      return JSON.stringify({
        coords: "origin:top-left x:right y:down canvas:430x650",
        mode: state.phase === "complete" ? "game_over" : "playing",
        battleMode: npcStrategy ? "quick" : "twoPlayers",
        scene: game.scene.getScenes(true)[0]?.scene.key ?? null,
        phase: state.phase,
        activePlayer,
        score: state.score,
        usedStats: state.usedStats,
        availableStats:
          activePlayer === "A" || activePlayer === "B"
            ? gameState.available(activePlayer)
            : [],
        round: state.score.A + state.score.B + 1,
        winner: state.winner,
      });
    };
    window.advanceTime = (milliseconds) =>
      new Promise((resolve) => window.setTimeout(resolve, milliseconds));

    return () => {
      EventBus.off(Events.BATTLE_COMPLETE, handleComplete);
      game.destroy(true);
      if (window.__GAME__ === game) {
        delete window.__GAME__;
        delete window.__GAME_STATE__;
        delete window.__EVENT_BUS__;
        delete window.__EVENTS__;
        delete window.render_game_to_text;
        delete window.advanceTime;
      }
    };
  }, [cardA, cardB, npcStrategy]);

  return (
    <div className={styles.shell}>
      <div
        ref={mountRef}
        className={styles.mount}
        role="application"
        aria-label={`FaceForge turn-based battle. Pick stats with touch, click, or number keys one through six.${npcStrategy ? " The NPC picks automatically." : " Press Enter when passing the device."}`}
        tabIndex={0}
      />
      <p className={styles.hint}>
        {npcStrategy
          ? "Tap a stat · Keyboard: 1–6 · NPC auto-picks"
          : "Tap a stat · Keyboard: 1–6 · Enter to pass"}
      </p>
    </div>
  );
}
