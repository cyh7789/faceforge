import { access, cp, mkdir } from "node:fs/promises";
import path from "node:path";

const sourceDirectory = path.resolve(
  "node_modules/@mediapipe/tasks-vision/wasm",
);
const outputDirectory = path.resolve("public/mediapipe/wasm");
const modelPath = path.resolve(
  "public/mediapipe/blaze_face_short_range.tflite",
);

await access(modelPath);
await mkdir(outputDirectory, { recursive: true });
await cp(sourceDirectory, outputDirectory, { recursive: true });

console.log("Prepared local MediaPipe WASM assets in public/mediapipe/wasm/.");
