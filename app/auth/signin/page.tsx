import Link from "next/link";

import { GoogleSignInButton } from "@/src/components/auth/google-sign-in-button";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const callbackUrl = sp.callbackUrl?.startsWith("/") ? sp.callbackUrl : "/dashboard";
  const error = sp.error;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm ring-1 ring-black/[0.04]">
        <h1 className="text-xl font-semibold text-hub-bar">Sign in</h1>

        {error === "AccessDenied" ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Access denied.
          </p>
        ) : error ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            Sign-in failed.
          </p>
        ) : null}

        <div className="mt-6">
          <GoogleSignInButton callbackUrl={callbackUrl} />
        </div>

        <p className="mt-6 text-center text-xs">
          <Link href="/" className="text-hub-ink hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
