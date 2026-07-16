import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DetectorLoadingPanel } from "./DetectorLoadingPanel";

describe("DetectorLoadingPanel", () => {
  it("shows the themed first-load state without an early escape", () => {
    const html = renderToStaticMarkup(
      createElement(DetectorLoadingPanel, {
        showSkip: false,
        onSkip: vi.fn(),
      }),
    );

    expect(html).toContain("魔鏡甦醒中…");
    expect(html).toContain("Waking the mirror…");
    expect(html).toContain("約 11 MB");
    expect(html).not.toContain("Skip detection");
  });

  it("offers a bilingual skip-detection action after the wait threshold", () => {
    const html = renderToStaticMarkup(
      createElement(DetectorLoadingPanel, {
        showSkip: true,
        onSkip: vi.fn(),
      }),
    );

    expect(html).toContain("載入比預期久一點");
    expect(html).toContain("略過偵測 · Skip detection");
  });
});
