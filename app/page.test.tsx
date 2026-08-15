import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { APPRENTICE_MOCHI } from "@/lib/engine/presets";
import CollectionHome, { CollectionCardDetail } from "./page";

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
    expect(html).toContain("Close");
    expect(html).toContain("Tap the card to flip");
    expect(html).toContain("Save Card Image");
    expect(html).toContain(`View card back: ${APPRENTICE_MOCHI.class.nameEn}`);
  });
});

describe("CollectionHome", () => {
  it("places the primary game actions before the full collection grid", () => {
    const html = renderToStaticMarkup(createElement(CollectionHome));
    const actionsIndex = html.indexOf('aria-label="Game modes"');
    const collectionIndex = html.indexOf('aria-labelledby="collection-title"');

    expect(actionsIndex).toBeGreaterThanOrEqual(0);
    expect(collectionIndex).toBeGreaterThan(actionsIndex);
    expect(html).toContain("Forge a fighter");
  });
});
