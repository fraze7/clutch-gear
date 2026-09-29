"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { safeReturnPath } from "@/lib/session";

// Starts GitHub sign-in. As a Server Action it works without JavaScript; the nextCookies plugin
// stores Better Auth's OAuth state cookie before sending the browser to GitHub.
export async function signInWithGitHubAction(formData: FormData) {
  const { url } = await auth.api.signInSocial({
    body: { provider: "github", callbackURL: safeReturnPath(formData.get("next")) },
  });
  if (!url) throw new Error("GitHub sign-in didn't return a URL");
  redirect(url);
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
