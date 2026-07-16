import { beforeEach, describe, expect, it, vi } from "vitest";

import { APPRENTICE_MOCHI } from "./engine/presets";
import { downloadCardImage } from "./card-image";

const toPng = vi.fn();

vi.mock("html-to-image", () => ({ toPng }));

describe("downloadCardImage", () => {
  beforeEach(() => {
    toPng.mockReset();
  });

  it("waits for the rendered card and downloads a deterministic PNG filename", async () => {
    const click = vi.fn();
    const anchor = { href: "", download: "", click };
    const node = {
      querySelectorAll: vi.fn(() => []),
    } as unknown as HTMLElement;
    toPng.mockResolvedValue("data:image/png;base64,card");
    vi.stubGlobal("document", {
      fonts: { ready: Promise.resolve() },
      createElement: vi.fn(() => anchor),
    });

    await downloadCardImage(node, APPRENTICE_MOCHI);

    expect(toPng).toHaveBeenCalledWith(node, {
      backgroundColor: "#fff6df",
      cacheBust: true,
      pixelRatio: 2,
    });
    expect(anchor.href).toBe("data:image/png;base64,card");
    expect(anchor.download).toBe(
      `${APPRENTICE_MOCHI.id}-${APPRENTICE_MOCHI.class.key}.png`,
    );
    expect(click).toHaveBeenCalledOnce();
  });
});
