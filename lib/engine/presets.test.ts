import { describe, expect, it } from "vitest";

import puffFixture from "@/fixtures/face-puff_grimace_sd.json";
import squintFixture from "@/fixtures/face-squint_grimace_sd.json";
import { parseYouCamResult } from "./parse";
import {
  APPRENTICE_MOCHI,
  GRIMACE_MASTER,
  PRESET_CARD_IDS,
} from "./presets";

describe("NPC preset cards", () => {
  it("builds Apprentice Mochi from the real face-puff fixture", () => {
    expect(APPRENTICE_MOCHI).toMatchObject({
      id: PRESET_CARD_IDS.APPRENTICE_MOCHI,
      isPreset: true,
      name: "見習生麻糬",
      nameEn: "Apprentice Mochi",
      npcStrategy: "apprentice",
      class: { key: "crater_warden", name: "隕坑守望者" },
      rarity: "common",
    });
    expect(APPRENTICE_MOCHI.rawScores).toEqual(
      parseYouCamResult(puffFixture),
    );
  });

  it("builds Grimace Master from the real face-squint fixture", () => {
    expect(GRIMACE_MASTER).toMatchObject({
      id: PRESET_CARD_IDS.GRIMACE_MASTER,
      isPreset: true,
      name: "鬼臉宗師",
      nameEn: "Grimace Master",
      npcStrategy: "master",
      class: { key: "drooping_regent", name: "垂簾聽政者" },
      rarity: "legendary",
    });
    expect(GRIMACE_MASTER.rawScores).toEqual(
      parseYouCamResult(squintFixture),
    );
  });
});
