// @vitest-environment node
// Signs test events with Stripe's own helper, so this checks real signature verification
import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fulfilCheckoutSession = vi.fn(async () => "paid");
const expireCheckoutSession = vi.fn(async () => undefined);
vi.mock("@/lib/orders", () => ({ fulfilCheckoutSession, expireCheckoutSession }));

const SECRET = "whsec_test_secret";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy_for_tests";
process.env.STRIPE_WEBHOOK_SECRET = SECRET;

const { POST } = await import("./route");
const stripe = new Stripe("sk_test_dummy_for_tests");

function event(type: string) {
  return JSON.stringify({ id: "evt_1", object: "event", type, data: { object: { id: "cs_test_1", object: "checkout.session" } } });
}

function request(body: string, signature?: string) {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers: signature ? { "stripe-signature": signature } : {},
  });
}

const sign = (body: string, secret = SECRET) => stripe.webhooks.generateTestHeaderString({ payload: body, secret });

beforeEach(() => {
  fulfilCheckoutSession.mockClear();
  expireCheckoutSession.mockClear();
});

describe("POST /api/stripe/webhook", () => {
  it("fulfils a correctly signed checkout.session.completed event", async () => {
    const body = event("checkout.session.completed");
    const res = await POST(request(body, sign(body)));
    expect(res.status).toBe(200);
    expect(fulfilCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({ id: "cs_test_1" }));
  });

  it("expires orders on checkout.session.expired", async () => {
    const body = event("checkout.session.expired");
    await POST(request(body, sign(body)));
    expect(expireCheckoutSession).toHaveBeenCalled();
    expect(fulfilCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects a missing or forged signature", async () => {
    const body = event("checkout.session.completed");
    expect((await POST(request(body))).status).toBe(400);
    expect((await POST(request(body, sign(body, "whsec_wrong")))).status).toBe(400);
    expect(fulfilCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects a body that was changed after signing", async () => {
    const body = event("checkout.session.expired");
    const tampered = event("checkout.session.completed");
    expect((await POST(request(tampered, sign(body)))).status).toBe(400);
    expect(fulfilCheckoutSession).not.toHaveBeenCalled();
  });

  it("acknowledges events it doesn't handle", async () => {
    const body = event("customer.created");
    expect((await POST(request(body, sign(body)))).status).toBe(200);
    expect(fulfilCheckoutSession).not.toHaveBeenCalled();
  });
});
