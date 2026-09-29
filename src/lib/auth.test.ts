// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
process.env.BETTER_AUTH_SECRET = "test-secret-that-is-long-enough-for-better-auth";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
const { auth } = await import("./auth");

describe("auth config", () => {
  const role = auth.options.user?.additionalFields?.role;

  it("never lets users set their own role", () => {
    expect(role?.input).toBe(false);
  });

  it("makes new users customers, not admins", () => {
    expect(role?.defaultValue).toBe("customer");
  });

  it("signs in with GitHub", () => {
    expect(auth.options.socialProviders).toHaveProperty("github");
  });

  it("keeps nextCookies as the last plugin, as Better Auth requires", () => {
    expect(auth.options.plugins?.at(-1)?.id).toBe("next-cookies");
  });
});
