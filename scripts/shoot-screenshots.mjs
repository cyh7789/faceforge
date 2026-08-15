// Devpost 提交用截圖：走一遍流程，在五個關鍵畫面截圖。
// 用法：BASE_URL=http://localhost:3101 node scripts/shoot-screenshots.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3101";
const OUT = process.env.OUT_DIR ?? "video-assets/screenshots";
const P1 = path.resolve("video-assets/p1-crop.jpg");
const P2 = path.resolve("video-assets/p2-crop.jpg");
const GAME = { WIDTH: 430 };
const BUTTON_X = [74, 215, 356];
const BUTTON_Y = [506, 576];

const beat = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("shot", name);
}

// 用鍵盤打完一回合：數字選的是「還沒用過的」stat，比 canvas 座標可靠
async function playRound(page) {
  await page.keyboard.press("1");
  await beat(900);
  await page.keyboard.press("Enter");
  await beat(500);
  await page.keyboard.press("1");
  await beat(4200);
}

async function draw(page, image) {
  await page.goto(`${BASE_URL}/draw`);
  await page.waitForSelector("#face-upload", { state: "attached" });
  await beat(1200);
  await page.setInputFiles("#face-upload", image);
  await page.waitForSelector("text=Face detected", { timeout: 30_000 });
  return page;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-video-capture=${path.resolve("video-assets/fakecam/p1.y4m")}`,
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    permissions: ["camera"],
  });
  const page = await context.newPage();

  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());

  // 1. 相機即時預覽，本地 face gate 判定 Ready
  await page.goto(`${BASE_URL}/draw`);
  await page.waitForSelector("[role='status']:has-text('Ready')", { timeout: 30_000 });
  await beat(1200);
  await shot(page, "01-face-gate");

  // 2. 卡片揭示
  await page.click("button[aria-label^='Take photo']");
  await beat(1500);
  await page.click("text=Consult Mirror");
  await page.waitForSelector("text=Tap to reveal", { timeout: 90_000 });
  await page.click("button[aria-label^='Reveal card']");
  await beat(3000);
  await shot(page, "02-card-reveal");

  // 3. 卡背星座圖
  await page.click("text=View Card Back");
  await beat(2500);
  await shot(page, "03-card-back");
  await page.click("button[aria-label^='Reveal card']");
  await beat(800);
  await page.click("text=Save to Collection");
  await page.waitForURL((url) => !url.pathname.includes("reveal"));

  await draw(page, P2);
  await page.click("text=Consult Mirror");
  await page.waitForSelector("text=Tap to reveal", { timeout: 90_000 });
  await page.click("button[aria-label^='Reveal card']");
  await beat(2500);
  await page.click("text=Save to Collection");
  await page.waitForURL((url) => !url.pathname.includes("reveal"));

  // 4. 圖鑑
  await page.goto(BASE_URL);
  await beat(1800);
  await shot(page, "04-collection");

  // 5. 對戰
  await page.goto(`${BASE_URL}/battle`);
  await beat(1000);
  await page.click("text=2 Players");
  await beat(800);
  // 用名次而不是職業名選卡：兩張卡可能是同一個職業，用文字會選到同一顆已鎖定的按鈕
  const roster = page.locator("section[aria-labelledby='roster-title'] button");
  await roster.nth(0).click();
  await beat(600);
  await page.click("text=Lock P1 Card");
  await beat(700);
  await page.click("text=I'm Player 2");
  await beat(600);
  await roster.nth(1).click();
  await beat(600);
  await page.click("text=Enter Arena");
  await page.waitForSelector("canvas", { timeout: 30_000 });
  await beat(2500);
  await page.keyboard.press("1");
  await beat(900);
  await page.keyboard.press("Enter");
  await beat(500);
  await page.keyboard.press("1");
  await beat(1200);
  await shot(page, "05-battle");
  await beat(3200);

  // 6. 對戰結果與 roast：把 BO3 剩下的回合打完
  for (let round = 0; round < 3; round += 1) {
    await playRound(page);
    if (await page.locator("text=Rematch").isVisible().catch(() => false)) break;
  }
  await beat(1500);
  await shot(page, "06-battle-result");

  // 7. 額度防火牆：相簿裡的無臉照被本地擋下
  await page.goto(`${BASE_URL}/draw`);
  await page.waitForSelector("#face-upload", { state: "attached" });
  await beat(1200);
  await page.setInputFiles("#face-upload", path.resolve("video-assets/upload-card.png"));
  await page.waitForSelector("text=Choose another photo with a face", { timeout: 30_000 });
  await beat(1200);
  await shot(page, "07-credit-firewall");

  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
