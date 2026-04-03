import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAdminRole } from "@/src/lib/auth/guards";
import { getClientAccountById } from "@/src/lib/platform/client-accounts-repo";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  if (isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }
  const cid = session.user.clientAccountId;
  if (cid) {
    const client = await getClientAccountById(cid);
    if (client) {
      redirect(`/clients/${client.slug}`);
    }
  }
  redirect("/portal");
}
