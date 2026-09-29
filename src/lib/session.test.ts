import { describe, expect, it, vi } from "vitest";

// session.ts imports the auth instance; these tests only need the pure helper
vi.mock("@/lib/auth", () => ({ auth: {} }));
const { safeReturnPath } = await import("./session");

describe("safeReturnPath", () => {
  it("allows paths on this site", () => {
    expect(safeReturnPath("/account")).toBe("/account");
    expect(safeReturnPath("/orders/abc?x=1")).toBe("/orders/abc?x=1");
  });

  it("blocks anything that could send someone to another site", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "account", ""]) {
      expect(safeReturnPath(bad), bad).toBe("/account");
    }
  });

  it("falls back when the value is missing or not a string", () => {
    expect(safeReturnPath(null)).toBe("/account");
    expect(safeReturnPath(undefined, "/")).toBe("/");
  });
});
