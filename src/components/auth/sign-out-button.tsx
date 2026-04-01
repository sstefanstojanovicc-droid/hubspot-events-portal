"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      className={
        className ??
        "rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20"
      }
    >
      Sign out
    </button>
  );
}
