import Link from "next/link";

type Props = {
  href: string;
};

/**
 * Single entry when open-app / auth-disabled mode is on (Vercel testing without Google).
 */
export function BypassLoginButton({ href }: Props) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center rounded-xl border-2 border-hub bg-hub px-4 py-3.5 text-center text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
    >
      Login
    </Link>
  );
}
