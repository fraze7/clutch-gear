import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Better Auth's endpoints, including the GitHub callback at /api/auth/callback/github
export const { GET, POST } = toNextJsHandler(auth);
