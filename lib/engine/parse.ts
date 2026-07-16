import { RAW_METRICS, type RawMetric, type RawScores } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseYouCamResult(input: unknown): RawScores {
  if (!isRecord(input) || !isRecord(input.data)) {
    throw new Error("Invalid YouCam result: missing data");
  }

  const results = input.data.results;
  if (!isRecord(results) || !Array.isArray(results.output)) {
    throw new Error("Invalid YouCam result: missing output");
  }

  const knownMetrics = new Set<string>(RAW_METRICS);
  const parsed: Partial<Record<RawMetric, number>> = {};

  for (const entry of results.output) {
    if (!isRecord(entry) || typeof entry.type !== "string") {
      continue;
    }
    if (!knownMetrics.has(entry.type) || typeof entry.raw_score !== "number") {
      continue;
    }
    if (!Number.isFinite(entry.raw_score)) {
      throw new Error(`Invalid YouCam result: ${entry.type} is not finite`);
    }

    parsed[entry.type as RawMetric] = entry.raw_score;
  }

  for (const metric of RAW_METRICS) {
    if (parsed[metric] === undefined) {
      throw new Error(`Invalid YouCam result: missing ${metric}`);
    }
  }

  return parsed as RawScores;
}
