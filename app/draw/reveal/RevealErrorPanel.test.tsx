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

    expect(html).toContain("No face found!");
    expect(html).toContain("The mirror can&#x27;t find a face!");
    expect(html).toContain(
      "Keep one clear, uncovered face centered in the frame.",
    );
    expect(html).toContain("Retake Photo");
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

    expect(html).toContain("The mirror went cloudy!");
    expect(html).toContain("The mirror fogged up!");
    expect(html).toContain("Your photo is safe. Retry, or take another one.");
    expect(html).toContain("Retry Ritual");
    expect(html).toContain("Retake Photo");
  });
});
