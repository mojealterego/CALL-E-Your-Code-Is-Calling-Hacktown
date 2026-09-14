import { describe, expect, it } from "vitest";
import { MARSController, buildImandraXProofRequest, localFormalGate, marsCycle } from "../src/imandrax-mars.js";

describe("ImandraX-style formal gate + MARS", () => {
  const invariant = { id: "route-accepted", check: (state: unknown) => (state as { routeAccepted: boolean }).routeAccepted === true };
  const constitutional = { id: "no-live-self-modification", predicate: () => true };

  it("builds a deterministic proof request and proves valid state", () => {
    const a = buildImandraXProofRequest("route is accepted", { routeAccepted: true }, [invariant]);
    const b = buildImandraXProofRequest("route is accepted", { routeAccepted: true }, [invariant]);
    expect(a.id).toBe(b.id);
    expect(localFormalGate({ routeAccepted: true }, [invariant]).proved).toBe(true);
  });

  it("fails closed on invariant violation", () => {
    const result = marsCycle("ambiguous carrier answer", ["missing evidence"], ["escalate"], { routeAccepted: false }, [invariant], [constitutional]);
    expect(result.accepted).toBe(false);
    expect(result.formal.proved).toBe(false);
    expect(result.formal.counterexample).toEqual({ failedInvariants: ["route-accepted"] });
  });

  it("keeps MARS bounded to one reflection cycle per invocation", () => {
    const controller = new MARSController();
    const result = controller.run(["verified answer", [], ["validate", "commit"], { routeAccepted: true }, [invariant], [constitutional]]);
    expect(result.accepted).toBe(true);
    expect(controller.snapshot().cycle).toBe(1);
  });
});
