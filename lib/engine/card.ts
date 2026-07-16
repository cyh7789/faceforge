import { classifyScores } from "./classify";
import { pickRoast } from "./roast";
import { buildStats } from "./stats";
import { RAW_METRICS, type Card, type RawScores } from "./types";
import { calculateWeirdness, rarityFromWeirdness } from "./weirdness";

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export function cardIdFromScores(rawScores: RawScores): string {
  const orderedValues = RAW_METRICS.map((metric) => rawScores[metric]);
  const hash = fnv1a(JSON.stringify(orderedValues));
  return `ff-${hash.toString(16).padStart(8, "0")}`;
}

export function buildCard(rawScores: RawScores): Card {
  const id = cardIdFromScores(rawScores);
  const weirdness = calculateWeirdness(rawScores);
  const classification = classifyScores(rawScores);

  return {
    id,
    class: classification.classInfo,
    rarity: rarityFromWeirdness(weirdness),
    weirdness,
    stats: buildStats(rawScores),
    talent: classification.talent,
    curse: classification.curse,
    rawScores: { ...rawScores },
    maskUrl: null,
    roast: pickRoast(classification.classInfo.key, id, classification.curse),
  };
}
