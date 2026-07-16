import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const sourceDirectory = path.resolve("../youcam-skin/concept-art");
const outputDirectory = path.resolve("public/classes");
const sourceNames = [
  "class-acne-summoner",
  "class-baggage-merchant",
  "class-crater-warden",
  "class-dewlight-paladin",
  "class-drooping-regent",
  "class-dry-mage",
  "class-flame-sorcerer",
  "class-matte-recluse",
  "class-night-assassin",
  "class-oil-berserker",
  "class-rugged-ranger",
  "class-sagging-swordmaster",
  "class-star-spot-diviner",
  "class-tear-trough-bard",
  "class-wrinkle-sage",
];

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  sourceNames.map((name) =>
    sharp(path.join(sourceDirectory, `${name}.png`))
      .resize(512, 512, { fit: "cover" })
      .webp({ quality: 88 })
      .toFile(path.join(outputDirectory, `${name}.webp`)),
  ),
);

console.log(`Prepared ${sourceNames.length} class assets in public/classes/.`);
