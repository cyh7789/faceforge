import Phaser from "phaser";

import { CLASS_ASSETS } from "@/lib/engine/assets";
import type {
  BattlePlayer,
  BattleRound,
} from "@/lib/engine/battle";
import type { StatKey } from "@/lib/engine/types";

import {
  COLORS,
  EFFECTS,
  GAME,
  LAYOUT,
  STAT_LABELS,
  TEXT_STYLE,
  TEXTURE,
  TIMING,
} from "../core/Constants";
import { EventBus, Events } from "../core/EventBus";
import { gameState } from "../core/GameState";

type FighterMap<T> = Record<BattlePlayer, T>;

export class BattleScene extends Phaser.Scene {
  private readonly reducedMotion: boolean;
  private fighterSprites!: FighterMap<Phaser.GameObjects.Image>;
  private scorePips!: FighterMap<Phaser.GameObjects.Arc[]>;
  private transientObjects: Phaser.GameObjects.GameObject[] = [];
  private availablePicks: StatKey[] = [];
  private awaitingPass = false;
  private busy = true;
  private wakeTimers: number[] = [];

  constructor(reducedMotion: boolean) {
    super("BattleScene");
    this.reducedMotion = reducedMotion;
  }

  init() {
    this.transientObjects = [];
    this.availablePicks = [];
    this.awaitingPass = false;
    this.busy = true;
    this.wakeTimers = [];
  }

  preload() {
    const { A, B } = gameState.match.cards;
    this.load.image(this.textureKey("A"), CLASS_ASSETS[A.class.key]);
    if (A.class.key !== B.class.key) {
      this.load.image(this.textureKey("B"), CLASS_ASSETS[B.class.key]);
    }
  }

  create() {
    this.createBackground();
    this.createParticleTexture();
    this.createFighters();
    this.createScorePips();
    this.createStatLedger();

    this.input.keyboard?.on("keydown", this.onKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    EventBus.emit(Events.SPECTACLE_ENTRANCE);
    this.playIntro();
  }

  private textureKey(player: BattlePlayer): string {
    const card = gameState.match.cards[player];
    if (player === "B" && card.class.key === gameState.match.cards.A.class.key) {
      return `battle-class-${gameState.match.cards.A.class.key}`;
    }
    return `battle-class-${card.class.key}`;
  }

  private createBackground() {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(
      COLORS.CREAM,
      COLORS.CREAM,
      COLORS.LAVENDER_SOFT,
      COLORS.PINK,
      1,
    );
    graphics.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    graphics.fillStyle(COLORS.WHITE, 0.28);
    graphics.fillCircle(48, 138, 58);
    graphics.fillCircle(387, 244, 42);
    graphics.lineStyle(3, COLORS.PLUM, 0.13);
    for (let x = -GAME.HEIGHT; x < GAME.WIDTH; x += 38) {
      graphics.lineBetween(x, 0, x + GAME.HEIGHT, GAME.HEIGHT);
    }
  }

  private createParticleTexture() {
    if (this.textures.exists(TEXTURE.PARTICLE)) {
      return;
    }
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(COLORS.WHITE);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture(TEXTURE.PARTICLE, 10, 10);
    graphics.destroy();
  }

  private createFighters() {
    const { A, B } = gameState.match.cards;
    const spriteA = this.add
      .image(-LAYOUT.SPRITE_SIZE, LAYOUT.SPRITE_Y, this.textureKey("A"))
      .setDisplaySize(LAYOUT.SPRITE_SIZE, LAYOUT.SPRITE_SIZE)
      .setDepth(4);
    const spriteB = this.add
      .image(GAME.WIDTH + LAYOUT.SPRITE_SIZE, LAYOUT.SPRITE_Y, this.textureKey("B"))
      .setDisplaySize(LAYOUT.SPRITE_SIZE, LAYOUT.SPRITE_SIZE)
      .setFlipX(true)
      .setDepth(4);
    this.fighterSprites = { A: spriteA, B: spriteB };

    this.add
      .text(LAYOUT.SPRITE_X.A, LAYOUT.NAME_Y, `${A.class.nameEn}\n${A.class.name}`, {
        align: "center",
        color: "#3f294f",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: TEXT_STYLE.NAME_SIZE,
        fontStyle: "bold",
        lineSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(LAYOUT.SPRITE_X.B, LAYOUT.NAME_Y, `${B.class.nameEn}\n${B.class.name}`, {
        align: "center",
        color: "#3f294f",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: TEXT_STYLE.NAME_SIZE,
        fontStyle: "bold",
        lineSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  private createScorePips() {
    const createPlayerPips = (player: BattlePlayer) => {
      const direction = player === "A" ? 1 : -1;
      const startX = player === "A" ? 28 : GAME.WIDTH - 28;
      this.add
        .text(startX, LAYOUT.SCORE_Y, player === "A" ? "P1" : "P2", {
          color: "#3f294f",
          fontFamily: TEXT_STYLE.FONT,
          fontSize: TEXT_STYLE.SMALL_SIZE,
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(8);

      return [1, 2].map((index) =>
        this.add
          .circle(
            startX + direction * (30 + (index - 1) * LAYOUT.SCORE_PIP_GAP),
            LAYOUT.SCORE_Y,
            LAYOUT.SCORE_PIP_RADIUS,
            COLORS.CREAM,
          )
          .setStrokeStyle(3, COLORS.PLUM)
          .setDepth(8),
      );
    };

    this.scorePips = {
      A: createPlayerPips("A"),
      B: createPlayerPips("B"),
    };
    this.updateScorePips();
  }

  private updateScorePips() {
    const { score } = gameState.match;
    (["A", "B"] as const).forEach((player) => {
      this.scorePips[player].forEach((pip, index) => {
        pip.setFillStyle(index < score[player] ? COLORS.GOLD : COLORS.CREAM);
      });
    });
  }

  private createStatLedger() {
    const graphics = this.add.graphics().setDepth(2);
    graphics.fillStyle(COLORS.WHITE, 0.72);
    graphics.fillRoundedRect(12, LAYOUT.LEDGER_TOP - 9, GAME.WIDTH - 24, 155, 18);
    graphics.lineStyle(2, COLORS.PLUM, 0.22);
    graphics.strokeRoundedRect(12, LAYOUT.LEDGER_TOP - 9, GAME.WIDTH - 24, 155, 18);

    const { cards } = gameState.match;
    Object.keys(STAT_LABELS).forEach((key, index) => {
      const stat = key as StatKey;
      const y = LAYOUT.LEDGER_TOP + index * LAYOUT.LEDGER_ROW_HEIGHT;
      if (index % 2 === 0) {
        graphics.fillStyle(COLORS.LAVENDER_SOFT, 0.55);
        graphics.fillRoundedRect(22, y - 9, GAME.WIDTH - 44, 20, 8);
      }
      this.add
        .text(78, y, String(cards.A.stats[stat]), this.ledgerValueStyle())
        .setOrigin(0.5)
        .setDepth(3);
      this.add
        .text(
          GAME.WIDTH / 2,
          y,
          `${STAT_LABELS[stat].label} · ${STAT_LABELS[stat].subtitle}`,
          this.ledgerLabelStyle(),
        )
        .setOrigin(0.5)
        .setDepth(3);
      this.add
        .text(GAME.WIDTH - 78, y, String(cards.B.stats[stat]), this.ledgerValueStyle())
        .setOrigin(0.5)
        .setDepth(3);
    });
  }

  private ledgerValueStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color: "#b24675",
      fontFamily: TEXT_STYLE.FONT,
      fontSize: TEXT_STYLE.BODY_SIZE,
      fontStyle: "bold",
    };
  }

  private ledgerLabelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color: "#3f294f",
      fontFamily: TEXT_STYLE.FONT,
      fontSize: TEXT_STYLE.SMALL_SIZE,
      fontStyle: "bold",
    };
  }

  private playIntro() {
    const banner = this.add
      .text(GAME.WIDTH / 2, LAYOUT.VS_Y, "VS", {
        color: "#fff6df",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: "44px",
        fontStyle: "bold",
        stroke: "#3f294f",
        strokeThickness: 9,
      })
      .setOrigin(0.5)
      .setScale(this.reducedMotion ? 1 : 0)
      .setDepth(10);

    if (this.reducedMotion) {
      this.fighterSprites.A.setX(LAYOUT.SPRITE_X.A);
      this.fighterSprites.B.setX(LAYOUT.SPRITE_X.B);
      this.delay(() => {
        banner.destroy();
        this.renderPickPhase("A");
      }, TIMING.REDUCED_STEP);
      return;
    }

    this.tweens.add({
      targets: this.fighterSprites.A,
      x: LAYOUT.SPRITE_X.A,
      duration: TIMING.INTRO_SLIDE,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: this.fighterSprites.B,
      x: LAYOUT.SPRITE_X.B,
      duration: TIMING.INTRO_SLIDE,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: banner,
      scale: 1,
      angle: 360,
      duration: TIMING.INTRO_SLIDE,
      ease: "Back.easeOut",
    });
    this.delay(() => {
      banner.destroy();
      this.renderPickPhase("A");
    }, TIMING.INTRO_SLIDE + TIMING.INTRO_HOLD);
  }

  private renderPickPhase(player: BattlePlayer) {
    this.clearTransientObjects();
    this.availablePicks = gameState.available(player);
    this.awaitingPass = false;
    this.busy = false;
    this.updateScorePips();

    const title = this.add
      .text(
        GAME.WIDTH / 2,
        LAYOUT.PICK_TITLE_Y,
        `${player === "A" ? "PLAYER 1" : "PLAYER 2"} PICK\n選一項未使用的屬性`,
        {
          align: "center",
          color: "#3f294f",
          fontFamily: TEXT_STYLE.FONT,
          fontSize: TEXT_STYLE.BODY_SIZE,
          fontStyle: "bold",
          lineSpacing: 2,
        },
      )
      .setOrigin(0.5)
      .setDepth(12);
    this.transientObjects.push(title);

    this.availablePicks.forEach((stat, index) => {
      const column = index % LAYOUT.BUTTON_CENTERS_X.length;
      const row = Math.floor(index / LAYOUT.BUTTON_CENTERS_X.length);
      const button = this.createStatButton(
        LAYOUT.BUTTON_CENTERS_X[column],
        LAYOUT.BUTTON_CENTERS_Y[row],
        player,
        stat,
        index,
      );
      this.transientObjects.push(button);
    });

    EventBus.emit(Events.BATTLE_STATE_CHANGED, gameState.match);
  }

  private createStatButton(
    x: number,
    y: number,
    player: BattlePlayer,
    stat: StatKey,
    index: number,
  ): Phaser.GameObjects.Container {
    const background = this.add.graphics();
    const drawBackground = (fill: number, offset = 0) => {
      background.clear();
      background.fillStyle(COLORS.PLUM);
      background.fillRoundedRect(
        -LAYOUT.BUTTON_WIDTH / 2,
        -LAYOUT.BUTTON_HEIGHT / 2 + 5,
        LAYOUT.BUTTON_WIDTH,
        LAYOUT.BUTTON_HEIGHT,
        14,
      );
      background.fillStyle(fill);
      background.fillRoundedRect(
        -LAYOUT.BUTTON_WIDTH / 2,
        -LAYOUT.BUTTON_HEIGHT / 2 + offset,
        LAYOUT.BUTTON_WIDTH,
        LAYOUT.BUTTON_HEIGHT,
        14,
      );
      background.lineStyle(3, COLORS.PLUM);
      background.strokeRoundedRect(
        -LAYOUT.BUTTON_WIDTH / 2,
        -LAYOUT.BUTTON_HEIGHT / 2 + offset,
        LAYOUT.BUTTON_WIDTH,
        LAYOUT.BUTTON_HEIGHT,
        14,
      );
    };
    drawBackground(COLORS.WHITE);

    const { label, subtitle } = STAT_LABELS[stat];
    const value = gameState.match.cards[player].stats[stat];
    const text = this.add
      .text(0, -1, `${index + 1}  ${label} ${value}\n${subtitle}`, {
        align: "center",
        color: "#3f294f",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: TEXT_STYLE.BODY_SIZE,
        fontStyle: "bold",
        lineSpacing: -1,
      })
      .setOrigin(0.5);
    const container = this.add
      .container(x, y, [background, text])
      .setSize(LAYOUT.BUTTON_WIDTH, LAYOUT.BUTTON_HEIGHT)
      .setInteractive({ useHandCursor: true })
      .setDepth(12);

    container.on("pointerover", () => drawBackground(COLORS.LAVENDER_SOFT));
    container.on("pointerout", () => drawBackground(COLORS.WHITE));
    container.on("pointerdown", () => drawBackground(COLORS.PINK, 4));
    container.on("pointerup", () => {
      drawBackground(COLORS.LAVENDER_SOFT);
      this.chooseStat(player, stat);
    });
    return container;
  }

  private chooseStat(player: BattlePlayer, stat: StatKey) {
    if (this.busy) {
      return;
    }
    this.busy = true;
    EventBus.emit(Events.SPECTACLE_ACTION, { player, stat });
    const state = gameState.pick(player, stat);
    EventBus.emit(Events.BATTLE_STATE_CHANGED, state);

    if (player === "A") {
      this.showPassInterstitial();
      return;
    }

    const round = state.rounds[state.rounds.length - 1];
    this.revealRound(round);
  }

  private showPassInterstitial() {
    this.clearTransientObjects();
    this.availablePicks = [];
    this.awaitingPass = true;
    this.busy = false;

    const shield = this.add
      .rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, COLORS.INK, 0.98)
      .setInteractive({ useHandCursor: true })
      .setDepth(40);
    const eyebrow = this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 90, "P1 LOCKED IN", {
        color: "#f2bfd1",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: TEXT_STYLE.SMALL_SIZE,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(41);
    const title = this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 25, "PASS TO\nPLAYER 2", {
        align: "center",
        color: "#fff6df",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: "34px",
        fontStyle: "bold",
        lineSpacing: 4,
      })
      .setOrigin(0.5)
      .setDepth(41);
    const subtitle = this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 68, "交給玩家 2 · Tap when ready", {
        color: "#e8dcf6",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: TEXT_STYLE.BODY_SIZE,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(41);

    const continueToPlayerB = () => {
      if (!this.awaitingPass) {
        return;
      }
      this.awaitingPass = false;
      this.renderPickPhase("B");
    };
    shield.once("pointerup", continueToPlayerB);
    this.transientObjects.push(shield, eyebrow, title, subtitle);
  }

  private revealRound(round: BattleRound) {
    this.clearTransientObjects();
    this.availablePicks = [];
    this.busy = true;

    const heading = this.add
      .text(GAME.WIDTH / 2, LAYOUT.PICK_TITLE_Y, "REVEAL! · 同時揭曉", {
        color: "#b24675",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: TEXT_STYLE.TITLE_SIZE,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(15);
    this.transientObjects.push(heading);

    const cardA = this.createRevealCard("A", round, -LAYOUT.REVEAL_CARD_WIDTH);
    const cardB = this.createRevealCard(
      "B",
      round,
      GAME.WIDTH + LAYOUT.REVEAL_CARD_WIDTH,
    );
    this.transientObjects.push(cardA.container, cardB.container);

    if (this.reducedMotion) {
      cardA.container.setX(LAYOUT.REVEAL_X.A);
      cardB.container.setX(LAYOUT.REVEAL_X.B);
      cardA.value.setText(String(round.values.A));
      cardB.value.setText(String(round.values.B));
    } else {
      this.tweens.add({
        targets: cardA.container,
        x: LAYOUT.REVEAL_X.A,
        duration: TIMING.REVEAL_FLY,
        ease: "Back.easeOut",
      });
      this.tweens.add({
        targets: cardB.container,
        x: LAYOUT.REVEAL_X.B,
        duration: TIMING.REVEAL_FLY,
        ease: "Back.easeOut",
      });
      this.countValue(cardA.value, round.values.A);
      this.countValue(cardB.value, round.values.B);
    }

    this.delay(
      () => this.finishReveal(round),
      TIMING.REVEAL_FLY + TIMING.VALUE_COUNT,
    );
  }

  private createRevealCard(
    player: BattlePlayer,
    round: BattleRound,
    startX: number,
  ) {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.PLUM);
    graphics.fillRoundedRect(
      -LAYOUT.REVEAL_CARD_WIDTH / 2,
      -LAYOUT.REVEAL_CARD_HEIGHT / 2 + 5,
      LAYOUT.REVEAL_CARD_WIDTH,
      LAYOUT.REVEAL_CARD_HEIGHT,
      16,
    );
    graphics.fillStyle(player === "A" ? COLORS.PINK : COLORS.LAVENDER_SOFT);
    graphics.fillRoundedRect(
      -LAYOUT.REVEAL_CARD_WIDTH / 2,
      -LAYOUT.REVEAL_CARD_HEIGHT / 2,
      LAYOUT.REVEAL_CARD_WIDTH,
      LAYOUT.REVEAL_CARD_HEIGHT,
      16,
    );
    graphics.lineStyle(3, COLORS.PLUM);
    graphics.strokeRoundedRect(
      -LAYOUT.REVEAL_CARD_WIDTH / 2,
      -LAYOUT.REVEAL_CARD_HEIGHT / 2,
      LAYOUT.REVEAL_CARD_WIDTH,
      LAYOUT.REVEAL_CARD_HEIGHT,
      16,
    );

    const pick = round.picks[player];
    const label = this.add
      .text(0, -23, `${STAT_LABELS[pick].label} · ${STAT_LABELS[pick].subtitle}`, {
        color: "#3f294f",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: TEXT_STYLE.SMALL_SIZE,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const value = this.add
      .text(0, 13, "0", {
        color: "#3f294f",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: "32px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const container = this.add
      .container(startX, LAYOUT.REVEAL_Y, [graphics, label, value])
      .setDepth(15);
    return { container, value };
  }

  private countValue(text: Phaser.GameObjects.Text, target: number) {
    this.tweens.addCounter({
      from: 0,
      to: target,
      duration: TIMING.VALUE_COUNT,
      ease: "Quad.easeOut",
      onUpdate: (tween) =>
        text.setText(String(Math.round(tween.getValue() ?? 0))),
    });
  }

  private finishReveal(round: BattleRound) {
    this.updateScorePips();
    if (round.winner === "tie") {
      this.showRoundBanner("TIE — PICK AGAIN\n平手，雙方重選", COLORS.LAVENDER);
      this.delay(() => this.renderPickPhase("A"), TIMING.TIE_HOLD, true);
      return;
    }

    this.playImpact(round.winner);
    this.showRoundBanner(
      `${round.winner === "A" ? "PLAYER 1" : "PLAYER 2"} WINS ROUND`,
      COLORS.GOLD,
    );
    this.delay(() => {
      if (gameState.match.phase === "complete") {
        this.playVictory(gameState.match.winner as BattlePlayer);
      } else {
        this.renderPickPhase("A");
      }
    }, TIMING.ROUND_HOLD, true);
  }

  private playImpact(winner: BattlePlayer) {
    const loser: BattlePlayer = winner === "A" ? "B" : "A";
    const attacker = this.fighterSprites[winner];
    const targetX =
      LAYOUT.SPRITE_X[loser] + (winner === "A" ? -LAYOUT.SPRITE_SIZE * 0.28 : LAYOUT.SPRITE_SIZE * 0.28);

    const impact = () => {
      EventBus.emit(Events.SPECTACLE_HIT, { winner, loser });
      if (!this.reducedMotion) {
        this.cameras.main.shake(
          EFFECTS.CAMERA_SHAKE_DURATION,
          EFFECTS.CAMERA_SHAKE_INTENSITY,
        );
        this.spawnImpactParticles(LAYOUT.SPRITE_X[loser], LAYOUT.SPRITE_Y);
        this.wobbleLoser(loser);
        this.hitStop();
      } else {
        this.showDizzyStars(loser, false);
      }
    };

    if (this.reducedMotion) {
      impact();
      return;
    }

    this.tweens.add({
      targets: attacker,
      x: targetX,
      duration: TIMING.LUNGE,
      ease: "Back.easeIn",
      yoyo: true,
      onYoyo: impact,
    });
  }

  private spawnImpactParticles(x: number, y: number) {
    const particles = this.add.particles(x, y, TEXTURE.PARTICLE, {
      angle: { min: 0, max: 360 },
      emitting: false,
      gravityY: EFFECTS.IMPACT_GRAVITY,
      lifespan: TIMING.PARTICLE_LIFE,
      scale: { start: 1, end: 0 },
      speed: { min: EFFECTS.IMPACT_SPEED_MIN, max: EFFECTS.IMPACT_SPEED_MAX },
      tint: [...COLORS.CONFETTI],
    });
    particles.setDepth(30);
    particles.explode(EFFECTS.IMPACT_PARTICLES);
    this.time.delayedCall(TIMING.PARTICLE_LIFE, () => particles.destroy());
  }

  private wobbleLoser(loser: BattlePlayer) {
    const sprite = this.fighterSprites[loser];
    const restingX = LAYOUT.SPRITE_X[loser];
    this.tweens.add({
      targets: sprite,
      x: restingX + EFFECTS.WOBBLE_DISTANCE,
      angle: 7,
      duration: EFFECTS.WOBBLE_DURATION,
      ease: "Sine.easeInOut",
      repeat: EFFECTS.WOBBLE_REPEAT,
      yoyo: true,
      onComplete: () => sprite.setPosition(restingX, LAYOUT.SPRITE_Y).setAngle(0),
    });
    this.showDizzyStars(loser, true);
  }

  private showDizzyStars(loser: BattlePlayer, animate: boolean) {
    const centerX = LAYOUT.SPRITE_X[loser];
    [-34, 0, 34].forEach((offset, index) => {
      const star = this.add
        .text(centerX + offset, LAYOUT.SPRITE_Y - 86 - (index % 2) * 10, "★", {
          color: "#d69b28",
          fontFamily: TEXT_STYLE.FONT,
          fontSize: "22px",
          stroke: "#3f294f",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(35);
      this.transientObjects.push(star);
      if (animate) {
        this.tweens.add({
          targets: star,
          y: star.y - 14,
          angle: 120,
          alpha: 0.35,
          duration: 430,
          delay: index * 70,
          repeat: 1,
          yoyo: true,
        });
      }
    });
  }

  private hitStop() {
    this.game.loop.sleep();
    const timer = window.setTimeout(() => {
      this.game.loop.wake();
      this.wakeTimers = this.wakeTimers.filter((id) => id !== timer);
    }, TIMING.HIT_STOP);
    this.wakeTimers.push(timer);
  }

  private showRoundBanner(copy: string, color: number) {
    const background = this.add
      .rectangle(GAME.WIDTH / 2, 245, GAME.WIDTH - 34, 48, color, 0.94)
      .setStrokeStyle(3, COLORS.PLUM)
      .setDepth(32);
    const text = this.add
      .text(GAME.WIDTH / 2, 245, copy, {
        align: "center",
        color: "#3f294f",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: TEXT_STYLE.BODY_SIZE,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(33);
    this.transientObjects.push(background, text);
  }

  private playVictory(winner: BattlePlayer) {
    this.clearTransientObjects();
    this.updateScorePips();
    this.busy = true;
    const sprite = this.fighterSprites[winner];
    sprite.setDepth(24);

    const crown = this.add
      .text(LAYOUT.SPRITE_X[winner], LAYOUT.SPRITE_Y - 105, "♛", {
        color: "#d69b28",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: "50px",
        stroke: "#3f294f",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(25);
    const copy = this.add
      .text(GAME.WIDTH / 2, LAYOUT.PICK_TITLE_Y + 55, "MATCH VICTORY!\n勝利姿態解鎖", {
        align: "center",
        color: "#3f294f",
        fontFamily: TEXT_STYLE.FONT,
        fontSize: "26px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(25);
    this.transientObjects.push(crown, copy);

    if (!this.reducedMotion) {
      this.tweens.add({
        targets: [sprite, crown],
        scale: EFFECTS.VICTORY_SCALE,
        y: `-=12`,
        duration: 280,
        ease: "Back.easeOut",
        yoyo: true,
      });
      this.spawnConfetti();
    }
    EventBus.emit(Events.SPECTACLE_VICTORY, { winner });
    this.delay(
      () => EventBus.emit(Events.BATTLE_COMPLETE, gameState.match),
      TIMING.VICTORY_HOLD,
      true,
    );
  }

  private spawnConfetti() {
    const particles = this.add.particles(GAME.WIDTH / 2, -12, TEXTURE.PARTICLE, {
      emitting: false,
      gravityY: EFFECTS.CONFETTI_GRAVITY,
      lifespan: TIMING.PARTICLE_LIFE * 3,
      rotate: { min: 0, max: 360 },
      scale: { min: 0.7, max: 1.4 },
      speedX: { min: -EFFECTS.CONFETTI_SPEED_X, max: EFFECTS.CONFETTI_SPEED_X },
      speedY: {
        min: EFFECTS.CONFETTI_SPEED_Y_MIN,
        max: EFFECTS.CONFETTI_SPEED_Y_MAX,
      },
      tint: [...COLORS.CONFETTI],
    });
    particles.setDepth(40);
    particles.explode(EFFECTS.CONFETTI_PARTICLES);
    this.time.delayedCall(TIMING.PARTICLE_LIFE * 3, () => particles.destroy());
  }

  private delay(callback: () => void, duration: number, preserveForReading = false) {
    const delay = this.reducedMotion && !preserveForReading
      ? TIMING.REDUCED_STEP
      : duration;
    this.time.delayedCall(delay, callback);
  }

  private clearTransientObjects() {
    this.transientObjects.forEach((object) => {
      if (object.active) {
        object.destroy();
      }
    });
    this.transientObjects = [];
  }

  private onKeyDown(event: KeyboardEvent) {
    if (this.awaitingPass && (event.key === "Enter" || event.key === " ")) {
      this.awaitingPass = false;
      this.renderPickPhase("B");
      return;
    }
    if (this.busy) {
      return;
    }
    const index = Number.parseInt(event.key, 10) - 1;
    const stat = this.availablePicks[index];
    if (stat) {
      const player: BattlePlayer = gameState.match.phase === "pickA" ? "A" : "B";
      this.chooseStat(player, stat);
    }
  }

  private cleanup() {
    this.input.keyboard?.off("keydown", this.onKeyDown, this);
    this.clearTransientObjects();
    this.wakeTimers.forEach((timer) => window.clearTimeout(timer));
    this.wakeTimers = [];
    this.game.loop.wake();
  }
}
