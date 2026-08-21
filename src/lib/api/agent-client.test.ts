import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { AgentClient } from "./agent-client";

describe("AgentClient", () => {
  let client: AgentClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = new AgentClient();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("lists threads for a project", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: "thread-1", projectId: "p1" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const threads = await client.listThreads("p1");

    expect(fetchSpy.mock.calls[0]?.[0]).toContain("/api/agent/threads?projectId=p1");
    expect(threads).toHaveLength(1);
  });

  it("archives a thread with POST", async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await client.archiveThread("thread-1");

    expect(fetchSpy.mock.calls[0]?.[0]).toContain("/api/agent/threads/thread-1/archive");
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
  });
});
