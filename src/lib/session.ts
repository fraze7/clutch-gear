// The signed-in user for the current request, or null. Reads request headers, so anything rendering it
// must sit inside <Suspense>. React's cache() means several components can ask without extra DB queries.
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

// Only same-site paths are allowed as a "return to" destination, so a link can't bounce someone to another site
export function safeReturnPath(value: unknown, fallback = "/account") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
