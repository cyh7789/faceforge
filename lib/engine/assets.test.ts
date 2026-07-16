import { access } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CLASS_ASSETS } from "./assets";
import { CLASS_BY_WEAKEST, PALADIN } from "./classify";

describe("CLASS_ASSETS", () => {
  it("maps every engine class key to a public asset", async () => {
    const classKeys = new Set([
      ...Object.values(CLASS_BY_WEAKEST).map((classInfo) => classInfo.key),
      PALADIN.key,
    ]);

    expect(classKeys.size).toBe(15);
    expect(new Set(Object.keys(CLASS_ASSETS))).toEqual(classKeys);

    await Promise.all(
      Object.values(CLASS_ASSETS).map((assetPath) =>
        access(path.join(process.cwd(), "public", assetPath.replace(/^\//, ""))),
      ),
    );
  });
});
