export type FaceGateState = "no-face" | "too-small" | "good" | "degraded";

export interface FaceBox {
  width: number;
}

interface FaceGateInput {
  detectorAvailable: boolean;
  faces: readonly FaceBox[];
  frameWidth: number;
  minimumFaceWidthRatio: number;
}

export interface LocalFaceDetector {
  detectImage(source: HTMLImageElement): Promise<FaceBox[]>;
  detectVideo(source: HTMLVideoElement, timestamp: number): Promise<FaceBox[]>;
  close(): void;
}

export function evaluateFaceGate({
  detectorAvailable,
  faces,
  frameWidth,
  minimumFaceWidthRatio,
}: FaceGateInput): FaceGateState {
  if (!detectorAvailable) {
    return "degraded";
  }
  if (faces.length === 0) {
    return "no-face";
  }

  const largestFaceWidth = Math.max(...faces.map((face) => face.width));
  if (largestFaceWidth / frameWidth < minimumFaceWidthRatio) {
    return "too-small";
  }
  return "good";
}

export async function createLocalFaceDetector(): Promise<LocalFaceDetector> {
  const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const detector = await FaceDetector.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: "/mediapipe/blaze_face_short_range.tflite",
    },
    minDetectionConfidence: 0.25,
    runningMode: "VIDEO",
  });
  let runningMode: "IMAGE" | "VIDEO" = "VIDEO";

  async function setRunningMode(nextMode: "IMAGE" | "VIDEO") {
    if (runningMode !== nextMode) {
      await detector.setOptions({ runningMode: nextMode });
      runningMode = nextMode;
    }
  }

  function faceBoxes(result: ReturnType<typeof detector.detect>): FaceBox[] {
    return result.detections.flatMap((detection) =>
      detection.boundingBox ? [{ width: detection.boundingBox.width }] : [],
    );
  }

  return {
    async detectImage(source) {
      await setRunningMode("IMAGE");
      return faceBoxes(detector.detect(source));
    },
    async detectVideo(source, timestamp) {
      await setRunningMode("VIDEO");
      return faceBoxes(detector.detectForVideo(source, timestamp));
    },
    close() {
      detector.close();
    },
  };
}
