// Playwright demo 錄影：走完 draw → reveal → collection → 2P battle 全流程。
// 用法：BASE_URL=http://localhost:3101 node scripts/record-demo.mjs
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3101";
const OUT_DIR = process.env.OUT_DIR ?? "video-assets/raw";
const P1 = path.resolve("video-assets/p1-crop.jpg");
const P2 = path.resolve("video-assets/p2-crop.jpg");

// Phaser 場景座標（games/battle/core/Constants.ts）
const GAME = { WIDTH: 430, HEIGHT: 650 };
const BUTTON_X = [74, 215, 356];
const BUTTON_Y = [506, 576];

const beat = (ms) => new Promise((r) => setTimeout(r, ms));

const marks = [];
let t0 = 0;
function mark(label) {
  const at = (Date.now() - t0) / 1000;
  marks.push({ label, at });
  console.log(`MARK ${label} ${at.toFixed(2)}`);
}

async function clickCanvasPoint(page, cx, cy) {
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("battle canvas not found");
  const scale = box.width / GAME.WIDTH;
  await page.mouse.click(box.x + cx * scale, box.y + cy * scale);
}

async function pickStat(page, index) {
  const cx = BUTTON_X[index % 3];
  const cy = BUTTON_Y[Math.floor(index / 3) % 2];
  await clickCanvasPoint(page, cx, cy);
}

async function drawCard(page, imagePath, label, markId, showBack = false) {
  await page.goto(`${BASE_URL}/draw`);
  await page.waitForSelector("#face-upload", { state: "attached" });
  await beat(1500);
  await page.setInputFiles("#face-upload", imagePath);
  await page.waitForSelector("text=Face detected", { timeout: 30_000 });
  await beat(1200);
  await page.click("text=Consult Mirror");
  // 魔鏡動畫 + 真 API（實測 5 秒上下）→ 卡片就緒後停在背面等玩家翻
  await page.waitForSelector("text=Tap to reveal", { timeout: 90_000 });
  await beat(1800);
  mark(`${markId}_card`);
  await page.click("button[aria-label^='Reveal card']");
  await beat(11000);
  if (showBack) {
    await page.click("text=View Card Back");
    await beat(3800);
    await page.click("button[aria-label^='Reveal card']");
    await beat(1500);
  }
  await page.click("text=Save to Collection");
  await page.waitForURL((url) => !url.pathname.includes("reveal"), { timeout: 15_000 });
  await beat(1500);
  console.log(`drew ${label}`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT_DIR, size: { width: 430, height: 932 } },
    permissions: [],
  });
  const page = await context.newPage();
  page.on("console", (m) => m.type() === "error" && console.log("PAGE ERR:", m.text()));

  // 1. 首頁（空圖鑑）
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  t0 = Date.now();
  mark("home");
  await beat(8000);

  // 2-3. 兩位玩家抽卡
  mark("draw1");
  await drawCard(page, P1, "player 1", "draw1");
  await page.goto(BASE_URL);
  await beat(1500);
  mark("draw2");
  await drawCard(page, P2, "player 2", "draw2");

  // 4. 圖鑑 + 翻卡
  mark("collection");
  await page.goto(BASE_URL);
  await beat(2500);
  const slot = page.locator("button.collection-slot").first();
  await slot.click();
  await beat(2200);
  await page.click("[role='dialog'] button[aria-label^='View card back']", { timeout: 5000 })
    .catch(() => {});
  await beat(3200);
  await page.click("text=Close");
  await beat(900);

  // 5. 2P 對戰
  mark("battle");
  await page.goto(`${BASE_URL}/battle`);
  await beat(1500);
  await page.click("text=2 Players");
  await beat(1200);

  const names = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("faceforge.collection.v1") ?? "[]");
    return raw.map((card) => card.class.nameEn);
  });
  console.log("roster:", names.join(", "));
  await page.locator("button", { hasText: names[0] }).last().click();
  await beat(1200);
  await page.click("text=Lock P1 Card");
  await beat(1500);
  await page.click("text=I'm Player 2");
  await beat(1200);
  await page.locator("button", { hasText: names[1] }).last().click();
  await beat(1200);
  await page.click("text=Enter Arena");
  await page.waitForSelector("canvas", { timeout: 30_000 });
  await beat(3000);

  // BO3：每回合兩位玩家各選一個 stat
  mark("rounds");
  for (let round = 0; round < 3; round += 1) {
    await pickStat(page, round);
    await beat(1400);
    await pickStat(page, round + 3);
    await beat(4200);
  }
  await beat(6000);

  // 6. 額度防火牆：無臉照被本地 gate 擋下，不會送到 API
  mark("gate");
  await page.goto(`${BASE_URL}/draw`);
  await page.waitForSelector("#face-upload", { state: "attached" });
  await beat(2000);
  await page.setInputFiles("#face-upload", path.resolve("video-assets/no-face.jpg"));
  await page.waitForSelector("text=Choose another photo with a face", { timeout: 30_000 });
  await beat(13000);

  // 7. 收尾：回圖鑑
  mark("outro");
  await page.goto(BASE_URL);
  await beat(7000);
  mark("end");

  writeFileSync(path.join(OUT_DIR, "marks.json"), JSON.stringify(marks, null, 2));
  await context.close();
  await browser.close();
  console.log("recorded to", OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
