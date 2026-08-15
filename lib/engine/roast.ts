import type { ClassKey, Curse } from "./types";

export const ROAST_LIBRARY: Readonly<Record<ClassKey, readonly string[]>> = {
  oil_glow_berserker: [
    "{curse} at {score}. Your forehead could pass a headlight inspection. Fine, you bring your own spotlight everywhere.",
    "{curse} at {score} and still charging in? Blotting paper wants to file for leave. Relax, the confidence works.",
    "{curse} at {score}. That is not oil, that is a personal energy policy. Fine, sustainable hero approved.",
  ],
  dry_mage: [
    "{curse} at {score}. Smile too hard and sand falls off. Fine, you hold the desert aesthetic together.",
    "{curse} at {score} and still no water? The serum wants to work overtime for you. Relax, mages run on willpower.",
    "{curse} at {score}. Your cheeks are drier than a hotel lobby in winter. Fine, that stubbornness has character.",
  ],
  acne_summoner: [
    "{curse} at {score}. Your friends did not all have to meet on your face. Fine, you are clearly popular.",
    "{curse} at {score} and still summoning? They are about to form a guild. Relax, you outshine all of them.",
    "{curse} at {score}. That is a lot of side quests on one face. Fine, you are still the main character.",
  ],
  matte_recluse: [
    "{curse} at {score}. Radiance took one look and went invisible. Fine, not everyone can carry matte.",
    "{curse} at {score} and you want a natural glow? The lighting crew already set up three lamps. Relax, you age well on camera.",
    "{curse} at {score}. Your highlight is as subtle as a message left on read. Fine, the mystery is doing numbers.",
  ],
  wrinkle_sage: [
    "{curse} at {score}. Every line has its own local government. Fine, only people with stories look like this.",
    "{curse} at {score}. Your forehead has a longer track record than your resume. Relax, that is seniority, not age.",
    "{curse} at {score} and worried about it? Those are receipts for laughing. Fine, you spent it well.",
  ],
  night_assassin: [
    "{curse} at {score}. Your dark circles keep a better schedule than you do. Fine, every lost night counts as XP.",
    "{curse} at {score}. A panda saw you and claimed family. Relax, the eyes still have drama in them.",
    "{curse} at {score} and you say you slept? Your under-eyes filed a different statement. Fine, go to bed early tonight.",
  ],
  flame_sorcerer: [
    "{curse} at {score}. Your cheeks are red enough to cover for a traffic light. Fine, nobody misses you in a room.",
    "{curse} at {score} and still playing it cool? Your face already streamed the whole feeling. Relax, honesty is a feature.",
    "{curse} at {score}. Blush has the day off, permanently. Fine, saving money is also a talent.",
  ],
  crater_warden: [
    "{curse} at {score} and you still showed up? The moon wants to compare terrain. Fine, that takes real nerve.",
    "{curse} at {score}. Your pores are throwing a summer festival. Relax, holding the ground looks good on you.",
    "{curse} at {score}. Up close there is a lot of map detail. Fine, working at every distance is a skill.",
  ],
  rugged_ranger: [
    "{curse} at {score}. Your texture is rough enough that scrubs want lessons. Fine, the outdoor look has character.",
    "{curse} at {score} and going for delicate? This is clearly the rugged road. Relax, you walk it steadily.",
    "{curse} at {score}. Your cheeks come with off-road conditions. Fine, adventurers never took the paved route.",
  ],
  sagging_swordmaster: [
    "{curse} at {score}. Gravity has quarterly targets and you are the account. Fine, the stare is still sharp.",
    "{curse} at {score}. The skin clocked out, the blade is still on duty. Relax, the presence holds.",
    "{curse} at {score} and you want to duel gravity? Bold. Fine, showing up for that fight earns respect.",
  ],
  bag_merchant: [
    "{curse} at {score}. The inventory under your eyes needs a stock count. Fine, it is all stocked with effort.",
    "{curse} at {score}. Both bags are nearly carry-on regulation. Relax, carrying that much is strength.",
    "{curse} at {score} and no clearance sale? That late-night stock has been sitting for months. Fine, one good sleep moves it.",
  ],
  starspot_diviner: [
    "{curse} at {score}. The star chart on your face beats the weather forecast. Fine, at least your universe has a plot.",
    "{curse} at {score}. Your spots arranged themselves into a birth chart. Relax, the mystique landed.",
    "{curse} at {score} and asking about your fortune? The answer is written on your face. Fine, it reads as brave.",
  ],
  tear_trough_bard: [
    "{curse} at {score}. Your tear troughs are deep enough to echo a ballad. Fine, romantics come with terrain.",
    "{curse} at {score}. Two storylines under the eyes, longer than a drama series. Relax, the lead role is still yours.",
    "{curse} at {score} and you have not spoken yet, but your face finished the chorus. Fine, the delivery works.",
  ],
  drooping_regent: [
    "{curse} at {score}. Your eyelids adjourned the meeting halfway through. Fine, that calm is genuinely regal.",
    "{curse} at {score} and you claim to be alert? Your eyelids already took the day off. Relax, languid is an aura.",
    "{curse} at {score}. You look at people in permanent power-saving mode. Fine, save the energy for ruling.",
  ],
  dewlight_paladin: [
    "Your weakest stat, {curse}, is still {score}. Are you here for analysis or to pick a fight? Fine, being this strong is your problem.",
    "{curse} bottoms out at {score}. Other players want to unplug the router. Relax, you are allowed a little pride.",
    "{curse} at {score} and you call that a weakness? You are wearing modesty as a costume. Fine, paladins earn it.",
  ],
};

function selectionNumber(cardId: string): number {
  const parsed = Number.parseInt(cardId.slice(-8), 16);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return [...cardId].reduce((total, character) => total + character.charCodeAt(0), 0);
}

export function pickRoast(classKey: ClassKey, cardId: string, curse: Curse): string {
  const lines = ROAST_LIBRARY[classKey];
  const template = lines[selectionNumber(cardId) % lines.length];

  return template
    .replaceAll("{curse}", curse.name)
    .replaceAll("{score}", String(Math.round(curse.score)));
}
