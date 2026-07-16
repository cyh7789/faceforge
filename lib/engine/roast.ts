import type { ClassKey, Curse } from "./types";

export const ROAST_LIBRARY: Readonly<Record<ClassKey, readonly string[]>> = {
  oil_glow_berserker: [
    "{curse} {score} 分，額頭亮到可以幫機車驗燈了。好啦，至少你走到哪都自帶追光。",
    "{curse} {score} 分還敢正面衝？吸油面紙看到你都想請特休。沒事，這份氣勢很可以。",
    "{curse} {score} 分，你不是出油，是臉上有自己的能源政策。好啦，永續勇者給過。",
  ],
  dry_mage: [
    "{curse} {score} 分，笑一下可能會掉沙。好啦，你至少把沙漠系氣場撐得很完整。",
    "{curse} {score} 分還不補水？保濕精華看到你都想主動加班。沒事，法師靠意志也能撐。",
    "{curse} {score} 分，臉頰乾得像台北冬天的除濕機。好啦，其實這種倔強很有角色感。",
  ],
  acne_summoner: [
    "{curse} {score} 分，小夥伴開會也不用全約在臉上吧。好啦，你的人緣確實很旺。",
    "{curse} {score} 分還在召喚？痘痘都快組公會了。沒事，你本人比牠們更搶眼。",
    "{curse} {score} 分，臉上支線任務有點多。好啦，主角還是你，別怕。",
  ],
  matte_recluse: [
    "{curse} {score} 分，光澤看到你直接隱形。好啦，霧面高級感不是人人撐得起。",
    "{curse} {score} 分還想自體打光？燈光師已經默默架好三盞。沒事，你很耐看。",
    "{curse} {score} 分，臉上的高光低調到像已讀不回。好啦，神祕感倒是滿分。",
  ],
  wrinkle_sage: [
    "{curse} {score} 分，每條紋路都像有自己的里長。好啦，故事多的人才有這種氣勢。",
    "{curse} {score} 分，額頭戰績比履歷還完整。沒事，這叫資歷，不叫老。",
    "{curse} {score} 分還怕被看見？那些都是你笑過的收據。好啦，人生很有本錢。",
  ],
  night_assassin: [
    "{curse} {score} 分，黑眼圈比你的行程更準時報到。好啦，熬過的夜都算經驗值。",
    "{curse} {score} 分，熊貓看了都想認親。沒事，你的眼神還是很有戲。",
    "{curse} {score} 分還說有睡？你的眼下已經提出不同證詞。好啦，今晚早點休息就好。",
  ],
  flame_sorcerer: [
    "{curse} {score} 分，兩頰紅到路口號誌想找你代班。好啦，氣色至少很有存在感。",
    "{curse} {score} 分還裝冷靜？臉已經先把情緒直播出去了。沒事，真誠是優點。",
    "{curse} {score} 分，腮紅今天根本不用上班。好啦，省下一筆也算天賦。",
  ],
  crater_warden: [
    "{curse} {score} 分還敢來？月球表面都想跟你交流地形。好啦，其實蠻有勇氣的。",
    "{curse} {score} 分，毛孔開得像在辦夏日祭典。沒事，你守得住場就很帥。",
    "{curse} {score} 分，近看地圖細節有點豐富。好啦，遠近都有戲也是本事。",
  ],
  rugged_ranger: [
    "{curse} {score} 分，膚理粗獷到磨砂膏想拜你為師。好啦，野外派就是有個性。",
    "{curse} {score} 分還走精緻路線？這明明是豪邁大道。沒事，你走得很穩。",
    "{curse} {score} 分，臉頰自帶越野路況。好啦，冒險家本來就不走柏油路。",
  ],
  sagging_swordmaster: [
    "{curse} {score} 分，地心引力對你特別有業績壓力。好啦，你的眼神還是很銳利。",
    "{curse} {score} 分，臉皮先休息，劍還在值班。沒事，氣勢有撐住。",
    "{curse} {score} 分還想跟重力單挑？很勇喔。好啦，敢挑戰就值得敬佩。",
  ],
  bag_merchant: [
    "{curse} {score} 分，眼下庫存多到可以盤點了。好啦，裝的都是你努力過的夜晚。",
    "{curse} {score} 分，兩個袋子都快符合手提行李規格。沒事，你扛得住就很強。",
    "{curse} {score} 分還不清倉？熬夜商品滯銷很久了。好啦，今晚補眠就能促銷。",
  ],
  starspot_diviner: [
    "{curse} {score} 分，臉上的星圖比氣象預報還完整。好啦，至少你的宇宙很有故事。",
    "{curse} {score} 分，斑點都排出自己的命盤了。沒事，神祕感確實有到。",
    "{curse} {score} 分還問運勢？答案已經寫在臉上。好啦，看起來是勇氣大吉。",
  ],
  tear_trough_bard: [
    "{curse} {score} 分，淚溝深到情歌放下去都有回音。好啦，浪漫的人本來就有故事。",
    "{curse} {score} 分，眼下兩條敘事線比連續劇還長。沒事，主角光環還在。",
    "{curse} {score} 分還沒開口，臉已經唱完副歌。好啦，感染力很夠。",
  ],
  drooping_regent: [
    "{curse} {score} 分，眼皮開會開到一半先散會。好啦，那份淡定確實很有王者感。",
    "{curse} {score} 分還說精神很好？眼皮已經替你請假。沒事，慵懶也是一種氣場。",
    "{curse} {score} 分，看人像永遠只開省電模式。好啦，省下來的力氣拿去掌權剛好。",
  ],
  dewlight_paladin: [
    "最弱的{curse}還有 {score} 分，是來分析還是來踢館？好啦，強成這樣也算你的錯。",
    "{curse}最低都 {score} 分，其他玩家看到會想拔網路線。沒事，你可以稍微驕傲一下。",
    "{curse} {score} 分還叫弱點？你這是把謙虛當造型。好啦，聖騎士確實有資格。",
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
