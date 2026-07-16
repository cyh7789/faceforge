import type { StatKey } from "@/lib/engine/types";

export const GAME = {
  WIDTH: 430,
  HEIGHT: 650,
  BACKGROUND_COLOR: "#fff6df",
} as const;

export const LAYOUT = {
  SAFE_TOP: 18,
  SCORE_Y: 31,
  NAME_Y: 66,
  SPRITE_Y: 184,
  SPRITE_X: { A: 105, B: 325 },
  SPRITE_SIZE: 168,
  VS_Y: 176,
  LEDGER_TOP: 274,
  LEDGER_ROW_HEIGHT: 24,
  PICK_TITLE_Y: 438,
  BUTTON_CENTERS_X: [74, 215, 356],
  BUTTON_CENTERS_Y: [506, 576],
  BUTTON_WIDTH: 122,
  BUTTON_HEIGHT: 56,
  REVEAL_Y: 506,
  REVEAL_X: { A: 126, B: 304 },
  REVEAL_CARD_WIDTH: 142,
  REVEAL_CARD_HEIGHT: 88,
  NPC_THINK_Y: 113,
  NPC_BUBBLE_WIDTH: 54,
  NPC_BUBBLE_HEIGHT: 34,
  SCORE_PIP_GAP: 19,
  SCORE_PIP_RADIUS: 7,
} as const;

export const TIMING = {
  INTRO_SLIDE: 620,
  INTRO_HOLD: 760,
  REVEAL_FLY: 420,
  VALUE_COUNT: 520,
  HIT_STOP: 72,
  LUNGE: 190,
  ROUND_HOLD: 1280,
  TIE_HOLD: 1200,
  VICTORY_HOLD: 900,
  NPC_THINK: 1000,
  PARTICLE_LIFE: 520,
  REDUCED_STEP: 120,
} as const;

export const EFFECTS = {
  CAMERA_SHAKE_DURATION: 150,
  CAMERA_SHAKE_INTENSITY: 0.012,
  IMPACT_PARTICLES: 16,
  CONFETTI_PARTICLES: 54,
  IMPACT_SPEED_MIN: 90,
  IMPACT_SPEED_MAX: 210,
  IMPACT_GRAVITY: 190,
  CONFETTI_SPEED_X: 170,
  CONFETTI_SPEED_Y_MIN: -330,
  CONFETTI_SPEED_Y_MAX: -170,
  CONFETTI_GRAVITY: 420,
  WOBBLE_DISTANCE: 12,
  WOBBLE_DURATION: 55,
  WOBBLE_REPEAT: 5,
  VICTORY_SCALE: 1.12,
} as const;

export const COLORS = {
  INK: 0x3f294f,
  PLUM: 0x735080,
  CREAM: 0xfff6df,
  CREAM_DEEP: 0xf4dfbd,
  PINK: 0xf2bfd1,
  PINK_DEEP: 0xb24675,
  LAVENDER: 0xa98cdb,
  LAVENDER_SOFT: 0xe8dcf6,
  GOLD: 0xd69b28,
  WHITE: 0xffffff,
  MUTED: 0xa8a3ad,
  HIT: 0xff7a8b,
  CONFETTI: [0xf2bfd1, 0xa98cdb, 0xd69b28, 0x72c7a5],
} as const;

export const TEXT_STYLE = {
  FONT: '"Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif',
  NAME_SIZE: "14px",
  SUBTITLE_SIZE: "10px",
  TITLE_SIZE: "22px",
  BODY_SIZE: "14px",
  SMALL_SIZE: "11px",
} as const;

export const STAT_LABELS: Readonly<
  Record<StatKey, { label: string; subtitle: string }>
> = {
  hp: { label: "HP", subtitle: "生命" },
  mp: { label: "MP", subtitle: "魔力" },
  def: { label: "DEF", subtitle: "防禦" },
  agi: { label: "AGI", subtitle: "敏捷" },
  luk: { label: "LUK", subtitle: "幸運" },
  grit: { label: "GRT", subtitle: "韌性" },
};

export const TEXTURE = {
  PARTICLE: "battle-particle",
} as const;
