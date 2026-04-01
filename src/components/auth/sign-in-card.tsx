import { BRANDING_APP_NAME } from "@/src/lib/platform/branding";

type SignInBrandHeaderProps = {
  logoSrc: string | null;
};

export function SignInBrandHeader({ logoSrc }: SignInBrandHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={BRANDING_APP_NAME}
          className="h-11 w-auto max-w-[200px] object-contain object-left"
        />
      ) : (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md"
          style={{
            background:
              "linear-gradient(135deg, var(--color-hub) 0%, var(--color-hub-hover) 100%)",
          }}
        >
          H
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-hub-bar">Sign in</h1>
        <p className="mt-0.5 text-sm font-medium text-hub">{BRANDING_APP_NAME}</p>
      </div>
    </div>
  );
}
