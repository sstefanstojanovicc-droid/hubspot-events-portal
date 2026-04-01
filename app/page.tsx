import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAdminRole } from "@/src/lib/auth/guards";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  if (isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }
  redirect("/portal");
}
