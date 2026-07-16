import frownFixture from "@/fixtures/face-frown_grimace_sd.json";
import neutralFixture from "@/fixtures/face-neutral_grimace_sd.json";
import puffFixture from "@/fixtures/face-puff_grimace_sd.json";
import roarFixture from "@/fixtures/face-roar_grimace_sd.json";
import squintFixture from "@/fixtures/face-squint_grimace_sd.json";
import { buildCard } from "@/lib/engine/card";
import { parseYouCamResult } from "@/lib/engine/parse";

export const runtime = "nodejs";

const YOUCAM_BASE_URL = "https://yce-api-01.makeupar.com/s2s/v2.0";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FLOW_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1_000;

const SD_ACTIONS = [
  "wrinkle",
  "droopy_upper_eyelid",
  "droopy_lower_eyelid",
  "firmness",
  "acne",
  "moisture",
  "eye_bag",
  "dark_circle_v2",
  "age_spot",
  "radiance",
  "redness",
  "oiliness",
  "pore",
  "texture",
  "tear_trough",
  "skin_type",
] as const;

const FIXTURES: readonly unknown[] = [
  neutralFixture,
  frownFixture,
  squintFixture,
  puffFixture,
  roarFixture,
];

type AnalyzeError =
  | "face_too_small"
  | "no_face"
  | "file_too_large"
  | "upstream_error";

class AnalyzeFailure extends Error {
  constructor(
    readonly code: AnalyzeError,
    readonly status: number,
  ) {
    super(code);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function upstreamMessage(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }
  if (typeof payload.error === "string") {
    return payload.error;
  }
  if (typeof payload.message === "string") {
    return payload.message;
  }
  if (isRecord(payload.data) && typeof payload.data.error === "string") {
    return payload.data.error;
  }
  return undefined;
}

function classifyUpstreamError(message: string | undefined, httpStatus?: number): AnalyzeFailure {
  const normalized = message?.toLowerCase() ?? "";

  if (
    httpStatus === 413 ||
    normalized.includes("exceed_max_filesize") ||
    normalized.includes("file_too_large") ||
    normalized.includes("payload too large")
  ) {
    return new AnalyzeFailure("file_too_large", 413);
  }
  if (
    normalized.includes("face_too_small") ||
    normalized.includes("list index out of range")
  ) {
    return new AnalyzeFailure("face_too_small", 422);
  }
  if (
    normalized.includes("no_face") ||
    normalized.includes("no face") ||
    normalized.includes("face_not_found") ||
    normalized.includes("face not found") ||
    normalized.includes("face_not_detected") ||
    normalized.includes("face not detected")
  ) {
    return new AnalyzeFailure("no_face", 422);
  }
  return new AnalyzeFailure("upstream_error", 502);
}

function remainingTime(deadline: number): number {
  const remaining = deadline - Date.now();
  if (remaining <= 0) {
    throw new AnalyzeFailure("upstream_error", 504);
  }
  return remaining;
}

async function fetchBeforeDeadline(
  input: string,
  init: RequestInit,
  deadline: number,
): Promise<Response> {
  try {
    return await fetch(input, {
      ...init,
      signal: AbortSignal.timeout(remainingTime(deadline)),
    });
  } catch (error) {
    if (error instanceof AnalyzeFailure) {
      throw error;
    }
    const timedOut =
      Date.now() >= deadline ||
      (error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "TimeoutError"));
    throw new AnalyzeFailure("upstream_error", timedOut ? 504 : 502);
  }
}

async function youCamJson(
  method: "GET" | "POST",
  path: string,
  apiKey: string,
  deadline: number,
  body?: unknown,
): Promise<unknown> {
  const response = await fetchBeforeDeadline(
    `${YOUCAM_BASE_URL}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    deadline,
  );

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AnalyzeFailure("upstream_error", 502);
  }

  if (!response.ok) {
    throw classifyUpstreamError(upstreamMessage(payload), response.status);
  }
  return payload;
}

function requiredRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new AnalyzeFailure("upstream_error", 502);
  }
  return value;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new AnalyzeFailure("upstream_error", 502);
  }
  return value;
}

function stringHeaders(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }
  const headers: Record<string, string> = {};
  for (const [key, headerValue] of Object.entries(value)) {
    if (typeof headerValue === "string") {
      headers[key] = headerValue;
    }
  }
  return headers;
}

function decodeJpeg(image: unknown): Uint8Array<ArrayBuffer> {
  if (typeof image !== "string") {
    throw new AnalyzeFailure("upstream_error", 400);
  }

  const dataUrlMatch = image.match(/^data:image\/jpe?g;base64,([\s\S]*)$/);
  const base64 = dataUrlMatch?.[1] ?? image;
  if (
    base64.length === 0 ||
    base64.length % 4 === 1 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)
  ) {
    throw new AnalyzeFailure("upstream_error", 400);
  }

  const decoded = Buffer.from(base64, "base64");
  const bytes = new Uint8Array(decoded.byteLength);
  bytes.set(decoded);
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new AnalyzeFailure("upstream_error", 400);
  }
  if (bytes.length > MAX_FILE_SIZE) {
    throw new AnalyzeFailure("file_too_large", 413);
  }
  return bytes;
}

async function registerFile(
  bytes: Uint8Array<ArrayBuffer>,
  apiKey: string,
  deadline: number,
): Promise<{ fileId: string; upload: Record<string, unknown> }> {
  const payload = requiredRecord(
    await youCamJson("POST", "/file/skin-analysis", apiKey, deadline, {
      files: [
        {
          content_type: "image/jpeg",
          file_name: "faceforge.jpg",
          file_size: bytes.byteLength,
        },
      ],
    }),
  );
  const data = requiredRecord(payload.data);
  if (!Array.isArray(data.files) || data.files.length === 0) {
    throw new AnalyzeFailure("upstream_error", 502);
  }
  const file = requiredRecord(data.files[0]);
  if (!Array.isArray(file.requests) || file.requests.length === 0) {
    throw new AnalyzeFailure("upstream_error", 502);
  }

  return {
    fileId: requiredString(file.file_id),
    upload: requiredRecord(file.requests[0]),
  };
}

async function uploadFile(
  bytes: Uint8Array<ArrayBuffer>,
  upload: Record<string, unknown>,
  deadline: number,
): Promise<void> {
  const response = await fetchBeforeDeadline(
    requiredString(upload.url),
    {
      method: requiredString(upload.method),
      headers: stringHeaders(upload.headers),
      body: bytes,
    },
    deadline,
  );
  if (!response.ok) {
    throw classifyUpstreamError(undefined, response.status);
  }
}

async function createTask(fileId: string, apiKey: string, deadline: number): Promise<string> {
  const payload = requiredRecord(
    await youCamJson("POST", "/task/skin-analysis", apiKey, deadline, {
      src_file_id: fileId,
      dst_actions: SD_ACTIONS,
      format: "json",
    }),
  );
  return requiredString(requiredRecord(payload.data).task_id);
}

async function pollTask(taskId: string, apiKey: string, deadline: number): Promise<unknown> {
  while (true) {
    const payload = requiredRecord(
      await youCamJson("GET", `/task/skin-analysis/${taskId}`, apiKey, deadline),
    );
    const data = requiredRecord(payload.data);
    const status = data.task_status ?? data.status;

    if (status === "success") {
      return payload;
    }
    if (status === "error") {
      throw classifyUpstreamError(upstreamMessage(payload));
    }
    if (status !== "running" && status !== "pending" && status !== "queued") {
      throw new AnalyzeFailure("upstream_error", 502);
    }

    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(POLL_INTERVAL_MS, remainingTime(deadline))),
    );
  }
}

async function analyzeLive(image: unknown): Promise<unknown> {
  const apiKey = process.env.YOUCAM_API_KEY;
  if (!apiKey) {
    throw new AnalyzeFailure("upstream_error", 502);
  }

  const bytes = decodeJpeg(image);
  const deadline = Date.now() + FLOW_TIMEOUT_MS;
  const { fileId, upload } = await registerFile(bytes, apiKey, deadline);
  await uploadFile(bytes, upload, deadline);
  const taskId = await createTask(fileId, apiKey, deadline);
  return pollTask(taskId, apiKey, deadline);
}

export async function POST(request: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AnalyzeFailure("upstream_error", 400);
    }
    if (!isRecord(body)) {
      throw new AnalyzeFailure("upstream_error", 400);
    }

    const result =
      process.env.MOCK_YOUCAM === "1"
        ? FIXTURES[Math.floor(Math.random() * FIXTURES.length)]
        : await analyzeLive(body.image);
    const card = buildCard(parseYouCamResult(result));
    return Response.json({ card });
  } catch (error) {
    if (error instanceof AnalyzeFailure) {
      return Response.json({ error: error.code }, { status: error.status });
    }
    return Response.json({ error: "upstream_error" }, { status: 502 });
  }
}
