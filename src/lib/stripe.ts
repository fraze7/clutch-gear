import Stripe from "stripe";

let client: Stripe | undefined;

// Created on first use, so builds and tests that never touch Stripe don't need the key
export function getStripe() {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // This is a demo store: refuse to run with a live key, so it can never take real money
  if (!/^(sk|rk)_test_/.test(key)) throw new Error("Clutch Gear only runs with a Stripe test-mode key");
  client = new Stripe(key);
  return client;
}
