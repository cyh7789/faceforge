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

async function pickStat(page, index) {
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  const scale = box.width / GAME.WIDTH;
  await page.mouse.click(
    box.x + BUTTON_X[index % 3] * scale,
    box.y + BUTTON_Y[Math.floor(index / 3) % 2] * scale,
  );
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
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());

  // 1. 本地 face gate 通過
  await draw(page, P1);
  await beat(800);
  await shot(page, "01-face-gate");

  // 2. 卡片揭示
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
  const names = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("faceforge.collection.v1") ?? "[]").map((c) => c.class.nameEn),
  );
  await page.locator("button", { hasText: names[0] }).last().click();
  await beat(600);
  await page.click("text=Lock P1 Card");
  await beat(700);
  await page.click("text=I'm Player 2");
  await beat(600);
  await page.locator("button", { hasText: names[1] }).last().click();
  await beat(600);
  await page.click("text=Enter Arena");
  await page.waitForSelector("canvas", { timeout: 30_000 });
  await beat(2500);
  await pickStat(page, 0);
  await beat(900);
  await pickStat(page, 3);
  await beat(1400);
  await shot(page, "05-battle");

  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
