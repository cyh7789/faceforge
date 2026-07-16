import { describe, expect, it } from "vitest";

import { evaluateFaceGate } from "./faceDetect";

describe("evaluateFaceGate", () => {
  it("degrades without blocking when the detector is unavailable", () => {
    expect(
      evaluateFaceGate({
        detectorAvailable: false,
        faces: [],
        frameWidth: 400,
        minimumFaceWidthRatio: 0.35,
      }),
    ).toBe("degraded");
  });

  it("rejects a frame with no face", () => {
    expect(
      evaluateFaceGate({
        detectorAvailable: true,
        faces: [],
        frameWidth: 400,
        minimumFaceWidthRatio: 0.35,
      }),
    ).toBe("no-face");
  });

  it("asks for a closer face when every face is too small", () => {
    expect(
      evaluateFaceGate({
        detectorAvailable: true,
        faces: [{ width: 120 }],
        frameWidth: 400,
        minimumFaceWidthRatio: 0.35,
      }),
    ).toBe("too-small");
  });

  it("accepts the largest face at the camera size threshold", () => {
    expect(
      evaluateFaceGate({
        detectorAvailable: true,
        faces: [{ width: 90 }, { width: 140 }],
        frameWidth: 400,
        minimumFaceWidthRatio: 0.35,
      }),
    ).toBe("good");
  });

  it("accepts any detected face when upload mode has no size gate", () => {
    expect(
      evaluateFaceGate({
        detectorAvailable: true,
        faces: [{ width: 1 }],
        frameWidth: 400,
        minimumFaceWidthRatio: 0,
      }),
    ).toBe("good");
  });
});
