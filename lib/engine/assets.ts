import type { ClassKey } from "./types";

export const CLASS_ASSETS = {
  oil_glow_berserker: "/classes/class-oil-berserker.webp",
  dry_mage: "/classes/class-dry-mage.webp",
  acne_summoner: "/classes/class-acne-summoner.webp",
  matte_recluse: "/classes/class-matte-recluse.webp",
  wrinkle_sage: "/classes/class-wrinkle-sage.webp",
  night_assassin: "/classes/class-night-assassin.webp",
  flame_sorcerer: "/classes/class-flame-sorcerer.webp",
  crater_warden: "/classes/class-crater-warden.webp",
  rugged_ranger: "/classes/class-rugged-ranger.webp",
  sagging_swordmaster: "/classes/class-sagging-swordmaster.webp",
  bag_merchant: "/classes/class-baggage-merchant.webp",
  starspot_diviner: "/classes/class-star-spot-diviner.webp",
  tear_trough_bard: "/classes/class-tear-trough-bard.webp",
  drooping_regent: "/classes/class-drooping-regent.webp",
  dewlight_paladin: "/classes/class-dewlight-paladin.webp",
} as const satisfies Readonly<Record<ClassKey, string>>;
