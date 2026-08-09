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

    expect(html).toContain("Waking the mirror…");
    expect(html).toContain("about 11 MB");
    expect(html).not.toContain("Skip detection");
  });

  it("offers a bilingual skip-detection action after the wait threshold", () => {
    const html = renderToStaticMarkup(
      createElement(DetectorLoadingPanel, {
        showSkip: true,
        onSkip: vi.fn(),
      }),
    );

    expect(html).toContain("Taking longer than expected");
    expect(html).toContain("Skip detection");
  });
});
