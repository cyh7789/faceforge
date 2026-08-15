import type { RawScores, Stats } from "./types";

export const STAT_LABELS: Readonly<Record<keyof Stats, string>> = {
  hp: "Dew",
  mp: "Aura",
  def: "Barrier",
  agi: "Glide",
  luk: "Purity",
  grit: "Weathering",
};

function clamp(value: number): number {
  return Math.max(1, Math.min(99, Math.round(value)));
}

export function buildStats(rawScores: RawScores): Stats {
  return {
    hp: clamp(rawScores.moisture),
    mp: clamp(rawScores.radiance),
    def: clamp((rawScores.firmness + rawScores.texture) / 2),
    agi: clamp((rawScores.pore + rawScores.texture) / 2),
    luk: clamp((rawScores.acne + rawScores.redness) / 2),
    grit: clamp(100 - rawScores.wrinkle),
  };
}
