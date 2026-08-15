# FaceForge Demo Video Script（正本）

> 這是唯一正本。舊的 `SUBMISSION.md` 內含的 2 分鐘腳本已作廢（那版是 MOCK 模式、無旁白版本用的）。
> 目標長度 1:55–2:05（比賽上限 3:00）。旁白英文，TTS 生成後與 Playwright 錄的畫面合成。
> 策略：Demo 派（操作畫面本身有衝擊力），開場 12 秒內講完定位，demo 段佔 65%。
> 分鏡風格：街機格鬥遊戲。VS 撞擊、角色選擇、回合快切、KO 定格。

## 硬性要求對照

- [x] live demo（100% winner 都有）：全片實機操作，無投影片
- [x] 旁白逐段點名 YouCam Skin Analysis API（規則硬性要求）
- [x] 真 API 錄製（非 mock），畫面上的卡片數值來自真實回應
- [x] 無第三方商標、無版權音樂

---

## 分鏡 + 旁白

> 旁白正本＝`scripts/make-vo.sh` 內的字串（TTS 實際讀的就是它）。本表由該檔同步。
> 語音：`en-US-AvaMultilingualNeural`（與 ASTRA 同一把女聲），語速 +8%。

| # | 時間 | 畫面 | 旁白 |
|---|------|------|------|
| 01 | 0:00–0:03 | 街機開場：兩張鬼臉左右滑入，VS 撞擊 + 震動 | Two ugly faces. One winner. |
| 02 | 0:03–0:11 | 首頁 FACEFORGE 標題 + 空的 15 宮格圖鑑 | Skin analysis apps grade your face and tell you what to fix. FaceForge takes the same scores and forges a fighter out of them. |
| 03 | 0:11–0:24 | 左右分割同步：P1 與 P2 各自上傳 → 本地 face gate 亮 Face detected → Consult Mirror | Two players, one phone, side by side. A local face detector confirms each face before anything leaves the device. Then the YouCam Skin Analysis API scores fifteen skin metrics for each player. |
| 04 | 0:24–0:37 | 左右分割同步：兩張卡同時翻開（RARE vs LEGENDARY），中央 VS 分隔 | Your worst metric picks your class. Pores at fifty forges the Crater Warden. Droopy eyelids crown the Drooping Regent. Six battle stats come straight out of the raw scores, and the mirror has opinions about both of you. |
| 06 | 0:37–0:53 | 圖鑑兩格點亮 → 點卡 → 翻面看星座卡背 | Fifteen classes to unlock, one for every metric the API scores. The API is deterministic to fourteen decimal places, so the same face always forges the same card. Flip it, and the back draws your own wrinkle constellation. |
| 07 | 0:53–0:59 | Battle → 2 Players → 選卡 → Lock P1 → 交接 → Enter Arena | Now put that face in the ring. Pick your fighter, lock it in, pass the phone. Best of three. |
| 08 | 0:59–1:11 | BO3 三回合快切：選 stat → REVEAL → hit-stop → 結果與 roast（裁成 canvas 區放大） | Round one. Pick a stat, hope yours is higher. Round two. Round three. Loser gets roasted by the mirror. Every number on screen came out of a real API response. |
| 09 | 1:11–1:27 | 上傳無臉照 → 本地 gate 擋下 → Consult Mirror 變灰，零 unit 消耗 | Everything here is built on measured API behavior. Bad photos cost seventy-eight seconds of silent retries, so the face gate stops them locally and saves credits. The flattering UI scores hide the interesting signal, so the whole engine runs on raw scores. |
| 10 | 1:27–1:33 | 回圖鑑收尾 | Skin analysis tells you your face is flawed. FaceForge says your face is legendary. |

## 產出鏈

1. `bash scripts/make-vo.sh` — 生 TTS 分段並印長度
2. `node scripts/record-demo.mjs` — Playwright 走完流程，錄 webm + 寫 marks.json（需先 `next build && next start`）
3. `python3 scripts/make_intro.py` — 街機開場卡
4. `python3 scripts/build_video.py` — 依 marks 切段、對齊旁白、套側欄、串接
5. `node scripts/shoot-screenshots.mjs` — Devpost 用五張截圖

成品：`video-assets/faceforge-demo.mp4`（88.1 秒，1920x1080，真 API 錄製）

## 錄製規格

- 解析度：390×844（iPhone 14 Pro）Playwright device viewport，錄影輸出放大到 1080×1920 或裁成 16:9 加側邊裝飾
- 真 API：`MOCK_YOUCAM=0`，兩次抽卡共 18 units；抽卡段左右分割同步播放（P1 左、P2 右）
- 素材圖：`video-assets/p1-crop.jpg`、`video-assets/p2-crop.jpg`（臉佔寬 67%，符合官方 60–80% 要求；原圖 38% 會回 `face_too_small`）
- 節奏：每個動作之間 stop 不超過 1.2 秒，對戰段每回合切點 ≤ 3 秒
