import { RAW_METRICS, type Rarity, type RawScores } from "./types";

export const GLOBAL_BASELINE: Readonly<RawScores> = {
  oiliness: 72.37520599365234,
  moisture: 54.05873656272888,
  acne: 92.23240000000001,
  radiance: 90.34932851791382,
  wrinkle: 96.31390571594238,
  dark_circle_v2: 92.42998361587524,
  redness: 100,
  pore: 56.762094378471375,
  texture: 59.06926989555359,
  firmness: 89.23001885414124,
  eye_bag: 68.58911514282227,
  age_spot: 93.22715759277344,
  tear_trough: 92.60340183973312,
  droopy_upper_eyelid: 74.52840209007263,
  droopy_lower_eyelid: 57.28439688682556,
};

export function calculateWeirdness(rawScores: RawScores): number {
  return RAW_METRICS.reduce(
    (total, metric) => total + Math.abs(rawScores[metric] - GLOBAL_BASELINE[metric]),
    0,
  );
}

export function rarityFromWeirdness(weirdness: number): Rarity {
  if (weirdness < 60) {
    return "common";
  }
  if (weirdness <= 150) {
    return "rare";
  }
  return "legendary";
}
