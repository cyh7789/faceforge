export const RAW_METRICS = [
  "oiliness",
  "moisture",
  "acne",
  "radiance",
  "wrinkle",
  "dark_circle_v2",
  "redness",
  "pore",
  "texture",
  "firmness",
  "eye_bag",
  "age_spot",
  "tear_trough",
  "droopy_upper_eyelid",
  "droopy_lower_eyelid",
] as const;

export type RawMetric = (typeof RAW_METRICS)[number];

export type RawScores = Record<RawMetric, number>;

export interface Stats {
  hp: number;
  mp: number;
  def: number;
  agi: number;
  luk: number;
  grit: number;
}

export type StatKey = keyof Stats;

export type Rarity = "common" | "rare" | "legendary";

export type ClassKey =
  | "oil_glow_berserker"
  | "dry_mage"
  | "acne_summoner"
  | "matte_recluse"
  | "wrinkle_sage"
  | "night_assassin"
  | "flame_sorcerer"
  | "crater_warden"
  | "rugged_ranger"
  | "sagging_swordmaster"
  | "bag_merchant"
  | "starspot_diviner"
  | "tear_trough_bard"
  | "drooping_regent"
  | "dewlight_paladin";

export interface ClassInfo {
  key: ClassKey;
  name: string;
  nameEn: string;
  flavor: string;
}

export interface Talent {
  metric: RawMetric;
  name: string;
}

export interface Curse {
  metric: RawMetric;
  name: string;
  score: number;
}

export interface Card {
  id: string;
  class: ClassInfo;
  rarity: Rarity;
  weirdness: number;
  stats: Stats;
  talent: Talent;
  curse: Curse;
  rawScores: RawScores;
  maskUrl: null;
  roast: string;
}
