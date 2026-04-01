/** Kanban columns for shortlist entry workflow (values stored in `shortlist_status` on the entry). */
export const SHORTLIST_ENTRY_STATUS_COLUMNS = [
  "New",
  "Internal review",
  "Sent to client",
  "Client reviewing",
  "Interview",
  "Hold",
  "Rejected",
  "Hired",
] as const;

export type ShortlistEntryStatusColumn = (typeof SHORTLIST_ENTRY_STATUS_COLUMNS)[number];

/** Normalise status for column matching (trim, collapse case for loose API data). */
export function normalizeEntryStatus(status: string | null | undefined): string {
  const s = (status ?? "").trim();
  if (!s) return "New";
  const found = SHORTLIST_ENTRY_STATUS_COLUMNS.find(
    (c) => c.toLowerCase() === s.toLowerCase(),
  );
  return found ?? s;
}

export function entryStatusColumn(status: string | null | undefined): ShortlistEntryStatusColumn {
  const n = normalizeEntryStatus(status);
  const hit = SHORTLIST_ENTRY_STATUS_COLUMNS.find((c) => c.toLowerCase() === n.toLowerCase());
  return hit ?? "New";
}

/** Review funnel for dashboard stats (substring match on entry shortlist_status). */
export const REVIEW_FUNNEL_STATUS_FRAGMENTS = [
  "interview",
  "client reviewing",
  "internal review",
  "sent to client",
];
