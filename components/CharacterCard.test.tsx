import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { APPRENTICE_MOCHI } from "@/lib/engine/presets";
import { fortuneForClass } from "@/lib/constellation";
import { CharacterCard } from "./CharacterCard";

vi.mock("next/image", () => ({
  default: () => null,
}));

describe("CharacterCard constellation back", () => {
  it("renders the card-derived canvas map and bilingual class fortune", () => {
    const html = renderToStaticMarkup(
      createElement(CharacterCard, {
        card: APPRENTICE_MOCHI,
        flipped: false,
      }),
    );

    expect(html).toContain(
      `aria-label="Wrinkle constellation map for ${APPRENTICE_MOCHI.class.nameEn}"`,
    );
    expect(html).toContain(fortuneForClass(APPRENTICE_MOCHI.class.key));
    expect(html).not.toContain("A face written in the stars");
  });
});
