"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/src/lib/auth/guards";
import {
  getEffectiveConnectionStatusAsync,
  requireClientOrNull,
} from "@/src/lib/platform/effective-client";
import { persistSearchBoardInstallFromSnapshot } from "@/src/lib/provisioning/persist-search-board-install";
import { executeSearchBoardLiveInstall } from "@/src/lib/provisioning/search-board-live-install";
import type { SearchBoardInstallReport } from "@/src/types/search-board-install-report";

export type RunSearchBoardInstallState = {
  ok: boolean;
  message: string;
  report?: SearchBoardInstallReport;
};

export async function runSearchBoardInstallAction(
  _prev: RunSearchBoardInstallState | undefined,
  formData: FormData,
): Promise<RunSearchBoardInstallState> {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const client = await requireClientOrNull(clientId);
  if (!client) {
    return { ok: false, message: "Unknown client." };
  }

  if ((await getEffectiveConnectionStatusAsync(client)) !== "connected") {
    return {
      ok: false,
      message: "Connect HubSpot for this client (matching portal) before running install.",
    };
  }

  const report = await executeSearchBoardLiveInstall();
  const persist = await persistSearchBoardInstallFromSnapshot(clientId, { installReport: report });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath(`/admin/clients/${clientId}/apps/search-board/install`);

  if (!persist.ok) {
    return {
      ok: false,
      message: persist.message,
      report,
    };
  }

  if (!report.ok) {
    return {
      ok: false,
      message: persist.message,
      report,
    };
  }

  redirect(
    `/admin/clients/${clientId}/apps/search-board/install?notify=install-complete`,
  );
}
