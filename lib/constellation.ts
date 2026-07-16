import type { ClassKey, RawScores } from "./engine/types";

export type ConstellationZone = "forehead" | "underEye" | "smileLine";

export interface ConstellationStar {
  zone: ConstellationZone;
  x: number;
  y: number;
  radius: number;
  brightness: number;
  smiley: boolean;
  points: 5 | 6;
  rotation: number;
}

export interface ConstellationLine {
  from: number;
  to: number;
  brightness: number;
}

export interface ConstellationLayout {
  stars: ConstellationStar[];
  lines: ConstellationLine[];
}

const ZONES: readonly ConstellationZone[] = [
  "forehead",
  "underEye",
  "smileLine",
];

const FORTUNE_BY_CLASS = {
  oil_glow_berserker: "油光照路，好運不迷路 · Shine on, luck follows.",
  dry_mage: "荒漠藏泉，轉角有甜 · A sweet oasis awaits.",
  acne_summoner: "星點成陣，貴人報到 · Your stars summon allies.",
  matte_recluse: "低調藏光，驚喜登場 · Quiet glow, loud luck.",
  wrinkle_sage: "紋路指北，笑運正盛 · Smile lines lead to luck.",
  night_assassin: "熬夜成星，今晨有喜 · Night stars bring dawn luck.",
  flame_sorcerer: "紅霞開運，心願升溫 · Warm wishes rise.",
  crater_warden: "毛孔納福，好事入住 · Good luck finds room.",
  rugged_ranger: "路粗運順，勇氣帶財 · Rough roads, smooth luck.",
  sagging_swordmaster: "重力向下，福氣向上 · Gravity dips, fortune lifts.",
  bag_merchant: "眼袋藏寶，今晚開箱 · Your eye bags hide treasure.",
  starspot_diviner: "星斑成圖，答案靠近 · Your star map knows.",
  tear_trough_bard: "淚溝成河，桃花靠岸 · Romance docks nearby.",
  drooping_regent: "眼簾半垂，福氣全開 · Sleepy eyes, open fortune.",
  dewlight_paladin: "水光滿格，願望連勝 · Full glow, winning wishes.",
} as const satisfies Readonly<Record<ClassKey, string>>;

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function normalizedDeficit(score: number): number {
  const bounded = Math.min(100, Math.max(0, score));
  return (100 - bounded) / 100;
}

export function getConstellationZoneScores(
  rawScores: RawScores,
): Readonly<Record<ConstellationZone, number>> {
  return {
    forehead: rawScores.wrinkle,
    underEye: rawScores.texture,
    smileLine: rawScores.pore,
  };
}

function starPosition(
  zone: ConstellationZone,
  index: number,
  count: number,
  random: () => number,
): { x: number; y: number } {
  if (zone === "forehead") {
    return {
      x: 0.28 + random() * 0.44,
      y: 0.24 + random() * 0.11,
    };
  }

  if (zone === "underEye") {
    const left = index % 2 === 0;
    const arc = random();
    return {
      x: left ? 0.22 + arc * 0.23 : 0.55 + arc * 0.23,
      y: 0.4 + Math.sin(arc * Math.PI) * 0.09 + random() * 0.02,
    };
  }

  const left = index % 2 === 0;
  const sideIndex = Math.floor(index / 2);
  const sideCount = Math.ceil(count / 2);
  const progress = Math.min(
    1,
    (sideIndex + random() * 0.35) / Math.max(1, sideCount - 0.65),
  );
  const curve = Math.sin(progress * Math.PI * 0.5);
  return {
    x: left ? 0.38 - curve * 0.13 : 0.62 + curve * 0.13,
    y: 0.54 + progress * 0.22,
  };
}

function createZoneStars(
  cardId: string,
  zone: ConstellationZone,
  score: number,
): ConstellationStar[] {
  const random = seededRandom(fnv1a(`${cardId}:${zone}`));
  const deficit = normalizedDeficit(score);
  const count = 3 + Math.round(deficit * 6);

  return Array.from({ length: count }, (_, index) => {
    const position = starPosition(zone, index, count, random);
    return {
      zone,
      x: round(position.x),
      y: round(position.y),
      radius: round(0.019 + random() * 0.011),
      brightness: round(0.5 + deficit * 0.42 + random() * 0.08),
      smiley: index === Math.floor(count / 2) || random() > 0.84,
      points: random() > 0.76 ? 6 : 5,
      rotation: round(random() * Math.PI * 2),
    };
  });
}

function connectGroup(
  indices: number[],
  stars: readonly ConstellationStar[],
  lines: ConstellationLine[],
  axis: "x" | "y",
): void {
  indices.sort((first, second) => stars[first][axis] - stars[second][axis]);
  for (let index = 1; index < indices.length; index += 1) {
    const from = indices[index - 1];
    const to = indices[index];
    lines.push({
      from,
      to,
      brightness: round(Math.min(stars[from].brightness, stars[to].brightness)),
    });
  }
}

function createLines(stars: readonly ConstellationStar[]): ConstellationLine[] {
  const lines: ConstellationLine[] = [];
  for (const zone of ZONES) {
    const indices = stars.flatMap((star, index) =>
      star.zone === zone ? [index] : [],
    );
    if (zone === "forehead") {
      connectGroup(indices, stars, lines, "x");
    } else {
      connectGroup(
        indices.filter((index) => stars[index].x < 0.5),
        stars,
        lines,
        zone === "underEye" ? "x" : "y",
      );
      connectGroup(
        indices.filter((index) => stars[index].x >= 0.5),
        stars,
        lines,
        zone === "underEye" ? "x" : "y",
      );
    }
  }
  return lines;
}

export function createConstellationLayout(
  cardId: string,
  rawScores: RawScores,
): ConstellationLayout {
  const scores = getConstellationZoneScores(rawScores);
  const stars = ZONES.flatMap((zone) =>
    createZoneStars(cardId, zone, scores[zone]),
  );
  return { stars, lines: createLines(stars) };
}

export function fortuneForClass(classKey: ClassKey): string {
  return FORTUNE_BY_CLASS[classKey];
}
