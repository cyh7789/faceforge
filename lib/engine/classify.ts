import {
  RAW_METRICS,
  type ClassInfo,
  type Curse,
  type RawMetric,
  type RawScores,
  type Talent,
} from "./types";

const DROOPING_REGENT: ClassInfo = {
  key: "drooping_regent",
  name: "Ruler of the Half-Closed Eye",
  nameEn: "Drooping Regent",
  flavor: "Eyelids at half-mast. You see through the court, and through you.",
};

export const CLASS_BY_WEAKEST: Readonly<Record<RawMetric, ClassInfo>> = {
  oiliness: {
    key: "oil_glow_berserker",
    name: "Keeper of the T-Zone",
    nameEn: "Oil-Glow Berserker",
    flavor: "Your T-zone is a reflective shield. Charging in needs no reason.",
  },
  moisture: {
    key: "dry_mage",
    name: "Caster of the Dry Season",
    nameEn: "Dry Mage",
    flavor: "Skin like a desert, magic like a dry wind. Serum is your mana potion.",
  },
  acne: {
    key: "acne_summoner",
    name: "Caller of Small Friends",
    nameEn: "Acne Summoner",
    flavor: "You are not angry. You are just summoning companions onto your face.",
  },
  radiance: {
    key: "matte_recluse",
    name: "Walker in the Shadow",
    nameEn: "Matte Recluse",
    flavor: "No highlight, no opening to attack. Matte is your invisibility spell.",
  },
  wrinkle: {
    key: "wrinkle_sage",
    name: "Bearer of the Lines",
    nameEn: "Wrinkle Sage",
    flavor: "Every line is a medal from a battle. The young ones understand nothing.",
  },
  dark_circle_v2: {
    key: "night_assassin",
    name: "Blade of the Fourth Hour",
    nameEn: "Night Assassin",
    flavor: "Dark circles are the badge of the night walker. You have seen every 4 a.m.",
  },
  redness: {
    key: "flame_sorcerer",
    name: "Bearer of the Burning Cheeks",
    nameEn: "Flame Sorcerer",
    flavor: "Permanent flame aura on both cheeks. Shy and furious look the same on you.",
  },
  pore: {
    key: "crater_warden",
    name: "Guardian of the Lunar Surface",
    nameEn: "Crater Warden",
    flavor: "Every pore is an impact crater, and you guard the whole moon.",
  },
  texture: {
    key: "rugged_ranger",
    name: "Rider of Rough Terrain",
    nameEn: "Rugged Ranger",
    flavor: "Thick skin travels far. Sandpaper texture is proof of survival.",
  },
  firmness: {
    key: "sagging_swordmaster",
    name: "Duelist Against Gravity",
    nameEn: "Sagging Swordmaster",
    flavor: "The skin gave up. The blade did not. Gravity is the only rival you respect.",
  },
  eye_bag: {
    key: "bag_merchant",
    name: "Trader of Sleepless Cargo",
    nameEn: "Under-Eye Bag Merchant",
    flavor: "Two large bags under the eyes, all stocked on borrowed nights.",
  },
  age_spot: {
    key: "starspot_diviner",
    name: "Reader of the Face Map",
    nameEn: "Starspot Diviner",
    flavor: "The spots form a star chart. You can read fortunes with one glance.",
  },
  tear_trough: {
    key: "tear_trough_bard",
    name: "Singer of the Deep Hollow",
    nameEn: "Tear-Trough Bard",
    flavor: "There are stories down there. Open your mouth and it is a three-hour epic.",
  },
  droopy_upper_eyelid: DROOPING_REGENT,
  droopy_lower_eyelid: DROOPING_REGENT,
};

export const PALADIN: ClassInfo = {
  key: "dewlight_paladin",
  name: "Bearer of the Halo",
  nameEn: "Dewlight Paladin",
  flavor: "Every stat maxed, a halo built into the face. Your existence damages other players.",
};

export const TALENT_BY_BEST: Readonly<Record<RawMetric, string>> = {
  moisture: "Dew Ward",
  radiance: "Self-Lighting",
  firmness: "Gravity Resistance",
  texture: "Silk Skin",
  pore: "Sealed Surface",
  acne: "Clear Realm",
  redness: "Cold Blood",
  wrinkle: "Frozen Age",
  oiliness: "Natural Matte",
  dark_circle_v2: "Actually Slept",
  eye_bag: "Nothing Below the Eyes",
  age_spot: "Flawless Night Sky",
  tear_trough: "Hollow Immunity",
  droopy_upper_eyelid: "Wide Awake",
  droopy_lower_eyelid: "Charm, Not Baggage",
};

export const METRIC_NAMES: Readonly<Record<RawMetric, string>> = {
  oiliness: "Oiliness",
  moisture: "Moisture",
  acne: "Acne",
  radiance: "Radiance",
  wrinkle: "Wrinkles",
  dark_circle_v2: "Dark Circles",
  redness: "Redness",
  pore: "Pores",
  texture: "Texture",
  firmness: "Firmness",
  eye_bag: "Eye Bags",
  age_spot: "Age Spots",
  tear_trough: "Tear Troughs",
  droopy_upper_eyelid: "Upper Eyelid Droop",
  droopy_lower_eyelid: "Lower Eyelid Droop",
};

export interface Classification {
  classInfo: ClassInfo;
  talent: Talent;
  curse: Curse;
}

export function classifyScores(rawScores: RawScores): Classification {
  let weakest: RawMetric = RAW_METRICS[0];
  let best: RawMetric = RAW_METRICS[0];

  for (const metric of RAW_METRICS.slice(1)) {
    if (rawScores[metric] < rawScores[weakest]) {
      weakest = metric;
    }
    if (rawScores[metric] > rawScores[best]) {
      best = metric;
    }
  }

  return {
    classInfo: RAW_METRICS.every((metric) => rawScores[metric] >= 85)
      ? PALADIN
      : CLASS_BY_WEAKEST[weakest],
    talent: { metric: best, name: TALENT_BY_BEST[best] },
    curse: {
      metric: weakest,
      name: METRIC_NAMES[weakest],
      score: rawScores[weakest],
    },
  };
}
