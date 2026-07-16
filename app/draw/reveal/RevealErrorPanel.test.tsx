import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { RevealErrorPanel } from "./RevealErrorPanel";

describe("RevealErrorPanel", () => {
  it("turns a no-face analysis into a bilingual retake path", () => {
    const html = renderToStaticMarkup(
      createElement(RevealErrorPanel, {
        code: "no_face",
        onRetry: vi.fn(),
        onRetake: vi.fn(),
      }),
    );

    expect(html).toContain("魔鏡找不到臉！");
    expect(html).toContain("No face found!");
    expect(html).toContain("請讓一張清楚、沒被遮住的臉待在畫面中央");
    expect(html).toContain("重拍 · Retake Photo");
    expect(html).not.toContain("Retry Ritual");
  });

  it("lets an analysis failure retry without discarding the photo", () => {
    const html = renderToStaticMarkup(
      createElement(RevealErrorPanel, {
        code: "upstream_error",
        onRetry: vi.fn(),
        onRetake: vi.fn(),
      }),
    );

    expect(html).toContain("魔鏡起霧了！");
    expect(html).toContain("The mirror went cloudy!");
    expect(html).toContain("照片還在");
    expect(html).toContain("再試一次 · Retry Ritual");
    expect(html).toContain("重拍 · Retake Photo");
  });
});
