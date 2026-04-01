import type { AppUserRole, AppUserStatus } from "@/src/types/auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AppUserRole;
      clientAccountId: string | null;
      status: AppUserStatus;
    };
  }

  interface User {
    role?: string;
    clientAccountId?: string | null;
    status?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    clientAccountId?: string | null;
    status?: string;
  }
}
