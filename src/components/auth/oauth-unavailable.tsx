export function OAuthUnavailableNotice() {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 px-4 py-4 text-center">
      <p className="text-sm font-medium text-hub-bar">Sign-in isn’t available yet</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        {isDev
          ? "Connect Google OAuth to enable this page."
          : "An administrator needs to finish sign-in setup."}
      </p>
      {isDev ? (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-xs font-medium text-hub hover:text-hub-hover">
            Developer setup
          </summary>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-600">
            <li>
              Set <code className="rounded bg-slate-100 px-1 py-0.5">AUTH_GOOGLE_ID</code> and{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">AUTH_GOOGLE_SECRET</code> in{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">.env.local</code>.
            </li>
            <li>Restart the dev server.</li>
            <li>
              In Google Cloud Console, add this redirect URI:{" "}
              <code className="break-all rounded bg-slate-100 px-1 py-0.5">
                http://localhost:3000/api/auth/callback/google
              </code>
            </li>
          </ol>
        </details>
      ) : null}
    </div>
  );
}
