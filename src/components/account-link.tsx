import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

const linkClass = "flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent/60";

export function SignInLink() {
  return (
    <Link href="/sign-in" className={linkClass}>
      Sign in
    </Link>
  );
}

// Reads the session, so it must render inside <Suspense> (see SiteHeader)
export async function AccountLink() {
  const session = await getSession();
  if (!session) return <SignInLink />;
  return (
    <>
      {isAdmin(session) && (
        <Link href="/admin" className={`${linkClass} text-warn`}>
          Admin
        </Link>
      )}
      <Link href="/account" className={linkClass} aria-label={`Account for ${session.user.name}`}>
        {session.user.image && <Image src={session.user.image} alt="" width={20} height={20} className="rounded-full" />}
        Account
      </Link>
    </>
  );
}
