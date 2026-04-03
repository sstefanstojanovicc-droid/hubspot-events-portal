import "server-only";

import { introspectHubSpotAccessToken } from "@/src/lib/hubspot/connection";
import { isHubSpotAccessTokenConfigured } from "@/src/lib/hubspot/env";
import { hubspotApiGetJson } from "@/src/lib/hubspot/http";
import { fetchHubSpotCustomSchemaSnapshot } from "@/src/lib/provisioning/hubspot-custom-schema-snapshot";

const STD_OBJECTS = ["deals", "contacts", "companies"] as const;

type PropertyRow = { name?: string; label?: string; type?: string };

type PipelineResult = {
  label?: string;
  id?: string;
  stages?: { label?: string; id?: string }[];
};

function linesForProps(objectLabel: string, rows: PropertyRow[], max = 45): string[] {
  const slice = rows.slice(0, max);
  if (!slice.length) {
    return [`- **${objectLabel}**: (could not load properties — check scopes)`];
  }
  const parts = slice.map((r) => {
    const lbl = r.label ? `${r.name} (${r.label})` : (r.name ?? "?");
    return `  - ${lbl}${r.type ? ` — ${r.type}` : ""}`;
  });
  return [`- **${objectLabel}** (${slice.length} sampled):`, ...parts];
}

async function fetchObjectProperties(objectType: string): Promise<PropertyRow[]> {
  const res = await hubspotApiGetJson<{ results?: PropertyRow[] }>(
    `/crm/v3/properties/${encodeURIComponent(objectType)}`,
  );
  if (!res.ok) {
    return [];
  }
  return res.data.results ?? [];
}

async function fetchDealPipelines(): Promise<PipelineResult[]> {
  const res = await hubspotApiGetJson<{ results?: PipelineResult[] }>("/crm/v3/pipelines/deals");
  if (!res.ok) {
    return [];
  }
  return res.data.results ?? [];
}

export type PortalInventoryForPrompt = {
  /** Human + model readable block */
  summaryMarkdown: string;
  /** Short line for UI tool chips */
  toolDetail: string;
  /** Token portal matches selected client */
  portalAligned: boolean;
  /** Could not read HubSpot (token, scopes, mismatch) */
  skipped: boolean;
};

/**
 * Loads a compact snapshot of the live HubSpot portal (same token as env).
 * Use with selected client: only trust inventory when portal ids match.
 */
export async function loadPortalInventoryForClient(
  clientHubspotPortalId: string,
): Promise<PortalInventoryForPrompt> {
  const expected = clientHubspotPortalId.trim();
  if (!expected) {
    return {
      summaryMarkdown:
        "_No HubSpot portal ID on this client — add it to the client record to enable duplicate checks._",
      toolDetail: "No client portal id",
      portalAligned: false,
      skipped: true,
    };
  }

  if (!isHubSpotAccessTokenConfigured()) {
    return {
      summaryMarkdown:
        "_HUBSPOT_ACCESS_TOKEN is not set — cannot read the portal. Plans may duplicate existing assets._",
      toolDetail: "No HubSpot token",
      portalAligned: false,
      skipped: true,
    };
  }

  const intro = await introspectHubSpotAccessToken();
  if (!intro.ok) {
    return {
      summaryMarkdown: `_Could not resolve token portal: ${intro.message}_`,
      toolDetail: "Token check failed",
      portalAligned: false,
      skipped: true,
    };
  }

  const aligned = intro.portalId === expected;
  if (!aligned) {
    return {
      summaryMarkdown: [
        `⚠️ **Portal mismatch** — selected client is portal **${expected}**, but HUBSPOT_ACCESS_TOKEN is for portal **${intro.portalId}**.`,
        "",
        "_Inventory was NOT loaded. Swap the token to this client’s private app (or correct the client portal id) before relying on duplicate avoidance._",
      ].join("\n"),
      toolDetail: `Token portal ${intro.portalId} ≠ client ${expected}`,
      portalAligned: false,
      skipped: true,
    };
  }

  const [customSnap, dealProps, contactProps, companyProps, pipelines] = await Promise.all([
    fetchHubSpotCustomSchemaSnapshot(),
    fetchObjectProperties("deals"),
    fetchObjectProperties("contacts"),
    fetchObjectProperties("companies"),
    fetchDealPipelines(),
  ]);

  const blocks: string[] = [];
  blocks.push(
    `Live inventory for portal **${expected}** (read-only). **Do not** propose creating custom objects, properties, or pipelines that already exist below — extend or reference them instead.`,
    "",
  );

  if (customSnap.rawError) {
    blocks.push(`- Custom schemas: _error ${customSnap.rawError}_`, "");
  } else if (customSnap.objectsBySchemaName.size === 0) {
    blocks.push("- **Custom objects**: none detected.", "");
  } else {
    blocks.push("### Custom objects");
    for (const [, obj] of customSnap.objectsBySchemaName) {
      const propNames = [...obj.properties.keys()].slice(0, 35);
      const assoc = obj.associations
        .slice(0, 8)
        .map((a) => `${a.fromObjectTypeId ?? "?"}→${a.toObjectTypeId ?? "?"}${a.name ? ` (${a.name})` : ""}`)
        .join("; ");
      blocks.push(
        `- **${obj.singularLabel}** (\`${obj.schemaName}\`, id \`${obj.objectTypeId}\`)`,
        `  - Properties (sample): ${propNames.join(", ") || "—"}`,
        assoc ? `  - Associations (sample): ${assoc}` : "",
      );
    }
    blocks.push("");
  }

  blocks.push("### Standard object properties (sample)");
  blocks.push(...linesForProps("Deal", dealProps));
  blocks.push(...linesForProps("Contact", contactProps));
  blocks.push(...linesForProps("Company", companyProps));
  blocks.push("");

  if (pipelines.length) {
    blocks.push("### Deal pipelines");
    for (const p of pipelines.slice(0, 6)) {
      const stages = (p.stages ?? []).map((s) => s.label ?? s.id).filter(Boolean);
      blocks.push(`- **${p.label ?? p.id}** — stages: ${stages.slice(0, 12).join(" → ") || "—"}`);
    }
    blocks.push("");
  }

  const customCount = customSnap.objectsBySchemaName.size;
  const toolDetail = `${STD_OBJECTS.join("+")} props · ${customCount} custom obj · ${pipelines.length} pipelines`;

  return {
    summaryMarkdown: blocks.filter((l) => l !== "").join("\n"),
    toolDetail,
    portalAligned: true,
    skipped: false,
  };
}
