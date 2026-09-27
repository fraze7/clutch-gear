// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("getStripe", () => {
  it("refuses a live key, so the demo can never take real money", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_123");
    const { getStripe } = await import("./stripe");
    expect(() => getStripe()).toThrow(/test-mode key/);
  });

  it("explains when the key is missing", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const { getStripe } = await import("./stripe");
    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY/);
  });

  it("accepts a test key", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    const { getStripe } = await import("./stripe");
    expect(getStripe()).toBeDefined();
  });
});
