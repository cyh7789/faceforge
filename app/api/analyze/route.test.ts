import { afterEach, describe, expect, it, vi } from "vitest";

import neutralFixture from "@/fixtures/face-neutral_grimace_sd.json";
import type { Card } from "@/lib/engine/types";
import { POST } from "./route";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function stubLiveFetch(taskResult: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        data: {
          files: [
            {
              file_id: "file-123",
              requests: [
                { method: "PUT", url: "https://uploads.example/file", headers: {} },
              ],
            },
          ],
        },
      }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 200 }))
    .mockResolvedValueOnce(Response.json({ data: { task_id: "task-123" } }))
    .mockResolvedValueOnce(Response.json(taskResult));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function liveRequest(): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image: "/9j/", mode: "battle" }),
  });
}

describe("POST /api/analyze", () => {
  it("runs a fixture through the card pipeline in mock mode", async () => {
    vi.stubEnv("MOCK_YOUCAM", "1");
    vi.spyOn(Math, "random").mockReturnValue(0);
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: "ignored-in-mock-mode", mode: "draw" }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { card: Card };

    expect(response.status).toBe(200);
    expect(body.card.class.name).toBe("Caster of the Dry Season");
    expect(body.card.id).toMatch(/^ff-[0-9a-f]{8}$/);
    expect(body.card.maskUrl).toBeNull();
    expect(Object.keys(body.card.rawScores)).toHaveLength(15);
  });

  it("runs register, upload, task creation, and polling in live mode", async () => {
    vi.stubEnv("MOCK_YOUCAM", "0");
    vi.stubEnv("YOUCAM_API_KEY", "test-key");
    const fetchMock = stubLiveFetch(neutralFixture);

    const response = await POST(liveRequest());
    const body = (await response.json()) as { card: Card };

    expect(response.status).toBe(200);
    expect(body.card.class.name).toBe("Caster of the Dry Season");
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const createTask = fetchMock.mock.calls[2]?.[1] as RequestInit;
    const taskBody = JSON.parse(String(createTask.body)) as { dst_actions: string[] };
    expect(taskBody.dst_actions).toHaveLength(16);
  });

  it.each([
    ["error_src_face_too_small", "face_too_small", 422],
    ["[DLQ] Max retries exhausted. Last error: list index out of range", "face_too_small", 422],
    ["error_src_face_out_of_bound", "face_out_of_bound", 422],
    ["error_src_no_face", "no_face", 422],
    ["error_src_face_not_detected", "no_face", 422],
    ["exceed_max_filesize", "file_too_large", 413],
    ["mystery failure", "upstream_error", 502],
  ] as const)("maps upstream error %s to %s", async (upstream, expected, status) => {
    vi.stubEnv("MOCK_YOUCAM", "0");
    vi.stubEnv("YOUCAM_API_KEY", "test-key");
    stubLiveFetch({ data: { task_status: "error", error: upstream } });

    const response = await POST(liveRequest());

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error: expected });
  });
});
