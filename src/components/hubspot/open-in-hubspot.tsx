"use client";

import { buildHubSpotCrmRecordUrl } from "@/src/lib/hubspot/record-url";

function HubSpotGlyph({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded bg-[#ff7a59] text-[9px] font-bold leading-none text-white ${className ?? ""}`}
      aria-hidden
    >
      HS
    </span>
  );
}

export function OpenInHubSpotIconLink({
  portalId,
  objectTypeId,
  recordId,
  className = "",
  title = "Open in HubSpot",
}: {
  portalId: string;
  objectTypeId: string;
  recordId: string;
  className?: string;
  /** Shown as tooltip and screen-reader label. */
  title?: string;
}) {
  const href = buildHubSpotCrmRecordUrl(portalId, objectTypeId, recordId);
  if (!href) {
    return null;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className={`inline-flex items-center justify-center rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-[#ff7a59] ${className}`}
    >
      <span className="sr-only">{title}</span>
      <HubSpotGlyph />
    </a>
  );
}
