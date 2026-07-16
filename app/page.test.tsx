import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { APPRENTICE_MOCHI } from "@/lib/engine/presets";
import { CollectionCardDetail } from "./page";

vi.mock("next/image", () => ({
  default: () => null,
}));

describe("CollectionCardDetail", () => {
  it("keeps flip, image save, and a clear close affordance in the touch dialog", () => {
    const html = renderToStaticMarkup(
      createElement(CollectionCardDetail, {
        card: APPRENTICE_MOCHI,
        flipped: true,
        savingImage: false,
        actionError: "",
        onFlip: vi.fn(),
        onClose: vi.fn(),
        onSaveImage: vi.fn(),
      }),
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain("Close · 關閉");
    expect(html).toContain("Tap the card to flip · 點卡片翻面");
    expect(html).toContain("Save Card Image · 儲存卡片圖片");
    expect(html).toContain(`View card back: ${APPRENTICE_MOCHI.class.nameEn}`);
  });
});
