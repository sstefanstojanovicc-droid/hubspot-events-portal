import Link from "next/link";

import { BypassLoginButton } from "@/src/components/auth/bypass-login-button";
import { GoogleSignInButton } from "@/src/components/auth/google-sign-in-button";
import { OAuthUnavailableNotice } from "@/src/components/auth/oauth-unavailable";
import { SignInBrandHeader } from "@/src/components/auth/sign-in-card";
import { isAuthDisabled } from "@/src/lib/auth/auth-disabled";
import { isGoogleOAuthConfigured } from "@/src/lib/auth/auth-env";
import { getSidebarLogoSrc } from "@/src/lib/platform/branding";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const callbackUrl = sp.callbackUrl?.startsWith("/") ? sp.callbackUrl : "/dashboard";
  const error = sp.error;
  const bypassAuth = isAuthDisabled();
  const googleReady = isGoogleOAuthConfigured();
  const logoSrc = await getSidebarLogoSrc();

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-5 py-12">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-black/[0.03]">
        <div className="h-1 bg-gradient-to-r from-hub via-hub-hover to-hub" aria-hidden />
        <div className="px-8 pb-8 pt-7">
          <SignInBrandHeader logoSrc={logoSrc} />

          {error === "Configuration" ? (
            <p className="mt-5 rounded-lg border border-rose-100 bg-rose-50/90 px-3.5 py-2.5 text-sm text-rose-900">
              Something’s wrong with authentication. If you’re developing locally, check the
              terminal for <span className="font-medium">[auth]</span> messages.
            </p>
          ) : error === "AccessDenied" ? (
            <p className="mt-5 rounded-lg border border-amber-100 bg-amber-50/90 px-3.5 py-2.5 text-sm text-amber-950">
              You don’t have access to this workspace.
            </p>
          ) : error ? (
            <p className="mt-5 rounded-lg border border-rose-100 bg-rose-50/90 px-3.5 py-2.5 text-sm text-rose-900">
              Sign-in didn’t complete. Try again.
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            {bypassAuth ? (
              <>
                <BypassLoginButton href={callbackUrl} />
                <p className="text-center text-xs text-slate-500">
                  Demo mode — you are redirected to the app automatically; this screen is only shown if
                  you open <code className="rounded bg-slate-100 px-1">/auth/signin</code> directly before
                  middleware runs. Turn off{" "}
                  <code className="rounded bg-slate-100 px-1">DEMO_MODE</code>,{" "}
                  <code className="rounded bg-slate-100 px-1">OPEN_APP_LOGIN</code>, or{" "}
                  <code className="rounded bg-slate-100 px-1">AUTH_DISABLED</code> when you enable real OAuth.
                </p>
              </>
            ) : googleReady ? (
              <GoogleSignInButton callbackUrl={callbackUrl} />
            ) : (
              <OAuthUnavailableNotice />
            )}
          </div>

          <p className="mt-8 text-center text-sm">
            <Link
              href="/"
              className="font-medium text-hub transition-colors hover:text-hub-hover hover:underline"
            >
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
