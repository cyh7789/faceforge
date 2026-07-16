import type { Card } from "./engine/types";

async function waitForImages(node: HTMLElement): Promise<void> {
  const pending = Array.from(node.querySelectorAll("img"))
    .filter((image) => !image.complete)
    .map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    );
  await Promise.all(pending);
}

export async function downloadCardImage(
  node: HTMLElement,
  card: Card,
): Promise<void> {
  await waitForImages(node);
  await document.fonts.ready;
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(node, {
    backgroundColor: "#fff6df",
    cacheBust: true,
    pixelRatio: 2,
  });
  const download = document.createElement("a");
  download.href = dataUrl;
  download.download = `${card.id}-${card.class.key}.png`;
  download.click();
}
