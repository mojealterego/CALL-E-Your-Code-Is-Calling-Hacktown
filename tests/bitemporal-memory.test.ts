import { describe, expect, it } from "vitest";
import { BitemporalMemoryStore } from "../src/bitemporal-memory.js";

describe("BitemporalMemoryStore", () => {
  it("reconstructs what was true and already known at a historical cutoff", () => {
    const store = new BitemporalMemoryStore<string>();

    store.put({
      id: "eta-v1",
      kind: "episodic",
      value: "ETA 16:40",
      validFrom: "2026-09-14T15:00:00Z",
      validTo: "2026-09-14T15:30:00Z",
      recordedAt: "2026-09-14T15:01:00Z",
    });
    store.put({
      id: "eta-v2",
      kind: "episodic",
      value: "ETA 17:10",
      validFrom: "2026-09-14T15:30:00Z",
      recordedAt: "2026-09-14T15:31:00Z",
      supersedes: "eta-v1",
    });

    expect(
      store.asOf("2026-09-14T15:20:00Z", "2026-09-14T15:10:00Z").map((x) => x.value),
    ).toEqual(["ETA 16:40"]);

    expect(
      store.asOf("2026-09-14T15:40:00Z", "2026-09-14T15:40:00Z").map((x) => x.value),
    ).toEqual(["ETA 17:10"]);
  });

  it("rejects invalid temporal intervals", () => {
    const store = new BitemporalMemoryStore<string>();
    expect(() =>
      store.put({
        id: "bad",
        kind: "working",
        value: "x",
        validFrom: "2026-09-14T16:00:00Z",
        validTo: "2026-09-14T15:00:00Z",
        recordedAt: "2026-09-14T16:01:00Z",
      }),
    ).toThrow("validTo must be an ISO timestamp after validFrom");
  });
});
