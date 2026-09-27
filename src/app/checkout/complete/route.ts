// Stripe sends the buyer here after paying. The session id in the URL isn't trusted on its own: the
// session is fetched from Stripe and fulfilled only if Stripe says it's paid. Doing this as well as the
// webhook means the order page is correct straight away, even if the webhook arrives a moment later.
import { NextResponse, type NextRequest } from "next/server";
import { CART_COOKIE } from "@/lib/cart";
import { fulfilCheckoutSession } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return NextResponse.redirect(new URL("/cart", request.url));
  }

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.redirect(new URL("/cart", request.url));
  }

  const orderId = session.metadata?.orderId;
  if (!orderId) return NextResponse.redirect(new URL("/cart", request.url));

  await fulfilCheckoutSession(session);

  const response = NextResponse.redirect(new URL(`/orders/${orderId}`, request.url));
  // The cart has been bought (or is being paid for by a slower method), so empty it
  if (session.status === "complete") response.cookies.delete(CART_COOKIE);
  return response;
}
