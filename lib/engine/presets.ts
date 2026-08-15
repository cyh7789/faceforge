import puffFixture from "@/fixtures/face-puff_grimace_sd.json";
import squintFixture from "@/fixtures/face-squint_grimace_sd.json";

import { buildCard } from "./card";
import type { NpcStrategy } from "./npc";
import { parseYouCamResult } from "./parse";
import type { Card } from "./types";

export const PRESET_CARD_IDS = {
  APPRENTICE_MOCHI: "preset-apprentice-mochi",
  GRIMACE_MASTER: "preset-grimace-master",
} as const;

export interface PresetCard extends Card {
  id: (typeof PRESET_CARD_IDS)[keyof typeof PRESET_CARD_IDS];
  isPreset: true;
  name: string;
  nameEn: string;
  npcStrategy: NpcStrategy;
}

function buildPresetCard(
  fixture: unknown,
  identity: Pick<PresetCard, "id" | "name" | "nameEn" | "npcStrategy">,
): PresetCard {
  return {
    ...buildCard(parseYouCamResult(fixture)),
    ...identity,
    isPreset: true,
  };
}

export const APPRENTICE_MOCHI = buildPresetCard(puffFixture, {
  id: PRESET_CARD_IDS.APPRENTICE_MOCHI,
  name: "Rookie of the Puffed Cheeks",
  nameEn: "Apprentice Mochi",
  npcStrategy: "apprentice",
});

export const GRIMACE_MASTER = buildPresetCard(squintFixture, {
  id: PRESET_CARD_IDS.GRIMACE_MASTER,
  name: "Master of the Squint",
  nameEn: "Grimace Master",
  npcStrategy: "master",
});

export const NPC_PRESETS: readonly PresetCard[] = [
  APPRENTICE_MOCHI,
  GRIMACE_MASTER,
];

export function isPresetCard(card: Card): card is PresetCard {
  return card.isPreset === true;
}
