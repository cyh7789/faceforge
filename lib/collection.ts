import type { Card, ClassKey, Rarity } from "./engine/types";

export const COLLECTION_STORAGE_KEY = "faceforge.collection.v1";

const RARITY_RANK: Readonly<Record<Rarity, number>> = {
  common: 0,
  rare: 1,
  legendary: 2,
};

export function addCard(collection: readonly Card[], card: Card): Card[] {
  if (collection.some(({ id }) => id === card.id)) {
    return collection as Card[];
  }

  return [...collection, card];
}

export function bestCardForClass(
  collection: readonly Card[],
  classKey: ClassKey,
): Card | undefined {
  let best: Card | undefined;

  for (const card of collection) {
    if (
      card.class.key === classKey &&
      (!best || RARITY_RANK[card.rarity] >= RARITY_RANK[best.rarity])
    ) {
      best = card;
    }
  }

  return best;
}
