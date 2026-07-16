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
  name: "垂簾聽政者",
  nameEn: "Drooping Regent",
  flavor: "眼皮半開半闔，看透朝堂，也看透你。",
};

export const CLASS_BY_WEAKEST: Readonly<Record<RawMetric, ClassInfo>> = {
  oiliness: {
    key: "oil_glow_berserker",
    name: "油光狂戰士",
    nameEn: "Oil-Glow Berserker",
    flavor: "T 字帶就是你的反光盾牌，正面剛不需要理由。",
  },
  moisture: {
    key: "dry_mage",
    name: "乾燥大法師",
    nameEn: "Dry Mage",
    flavor: "肌膚如沙漠，法力如荒風。保濕精華是你的魔力藥水。",
  },
  acne: {
    key: "acne_summoner",
    name: "痘痘召喚師",
    nameEn: "Acne Summoner",
    flavor: "你不生氣，你只是在臉上召喚小夥伴。",
  },
  radiance: {
    key: "matte_recluse",
    name: "霧面隱者",
    nameEn: "Matte Recluse",
    flavor: "沒有高光，沒有破綻。你行走於陰影，霧面就是你的隱身術。",
  },
  wrinkle: {
    key: "wrinkle_sage",
    name: "紋路賢者",
    nameEn: "Wrinkle Sage",
    flavor: "每一道皺紋都是一場戰役的軍功章。年輕人懂什麼。",
  },
  dark_circle_v2: {
    key: "night_assassin",
    name: "暗夜刺客",
    nameEn: "Night Assassin",
    flavor: "黑眼圈是夜行者的勳章，你見過凌晨四點的每一集。",
  },
  redness: {
    key: "flame_sorcerer",
    name: "烈焰術士",
    nameEn: "Flame Sorcerer",
    flavor: "兩頰常駐火焰護體，害羞跟上火只有一線之隔。",
  },
  pore: {
    key: "crater_warden",
    name: "隕坑守望者",
    nameEn: "Crater Warden",
    flavor: "臉上的每個毛孔都是隕石坑，而你是月球表面的守護神。",
  },
  texture: {
    key: "rugged_ranger",
    name: "粗獷遊俠",
    nameEn: "Rugged Ranger",
    flavor: "皮糙肉厚走天下，磨砂質感是野外生存的證明。",
  },
  firmness: {
    key: "sagging_swordmaster",
    name: "垂暮劍豪",
    nameEn: "Sagging Swordmaster",
    flavor: "臉皮鬆了，刀還沒鈍。地心引力是你唯一敬佩的對手。",
  },
  eye_bag: {
    key: "bag_merchant",
    name: "囊袋商人",
    nameEn: "Under-Eye Bag Merchant",
    flavor: "眼下兩個大袋子，裝的都是熬夜囤的貨。",
  },
  age_spot: {
    key: "starspot_diviner",
    name: "星斑占卜師",
    nameEn: "Starspot Diviner",
    flavor: "臉上的斑點自成星圖，你抬手就能給人算命。",
  },
  tear_trough: {
    key: "tear_trough_bard",
    name: "淚溝吟遊詩人",
    nameEn: "Tear-Trough Bard",
    flavor: "淚溝深處有故事，一開口就是三小時的敘事詩。",
  },
  droopy_upper_eyelid: DROOPING_REGENT,
  droopy_lower_eyelid: DROOPING_REGENT,
};

export const PALADIN: ClassInfo = {
  key: "dewlight_paladin",
  name: "水光聖騎士",
  nameEn: "Dewlight Paladin",
  flavor: "全屬性頂配，臉上自帶天使環光。你的存在就是對其他玩家的傷害。",
};

export const TALENT_BY_BEST: Readonly<Record<RawMetric, string>> = {
  moisture: "水潤結界",
  radiance: "自體打光",
  firmness: "地心引力抗性",
  texture: "絲綢皮膚",
  pore: "無孔不入・反轉",
  acne: "淨界",
  redness: "冷靜之心",
  wrinkle: "凍齡詛咒（良性）",
  oiliness: "霧面天成",
  dark_circle_v2: "睡飽的人",
  eye_bag: "眼下無事",
  age_spot: "無瑕星空",
  tear_trough: "淚溝免疫",
  droopy_upper_eyelid: "炯炯有神",
  droopy_lower_eyelid: "臥蠶而非眼袋",
};

export const METRIC_NAMES: Readonly<Record<RawMetric, string>> = {
  oiliness: "油光",
  moisture: "水潤",
  acne: "痘痘",
  radiance: "光澤",
  wrinkle: "皺紋",
  dark_circle_v2: "黑眼圈",
  redness: "泛紅",
  pore: "毛孔",
  texture: "膚理",
  firmness: "緊緻",
  eye_bag: "眼袋",
  age_spot: "斑點",
  tear_trough: "淚溝",
  droopy_upper_eyelid: "上眼皮下垂",
  droopy_lower_eyelid: "下眼皮下垂",
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
