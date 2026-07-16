import type { RawScores, Stats } from "./types";

export const STAT_LABELS: Readonly<Record<keyof Stats, string>> = {
  hp: "水潤",
  mp: "靈氣",
  def: "屏障",
  agi: "細滑",
  luk: "淨運",
  grit: "風霜",
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
