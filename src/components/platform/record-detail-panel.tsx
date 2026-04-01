import type { DisplayFieldConfig } from "@/src/types/platform";
import type { HubSpotRecord } from "@/src/types/hubspot";

interface RecordDetailPanelProps {
  title: string;
  record: HubSpotRecord | null;
  fields: DisplayFieldConfig[];
}

export function RecordDetailPanel({
  title,
  record,
  fields,
}: RecordDetailPanelProps) {
  return (
    <aside className="h-full rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>

      {!record ? (
        <p className="mt-4 text-sm text-slate-500">
          Select a record to inspect details, associations, and actions.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {String(record.properties.name ?? `Record ${record.id}`)}
            </p>
            <p className="text-xs text-slate-500">HubSpot ID: {record.id}</p>
          </div>

          <dl className="space-y-3">
            {fields.map((field) => (
              <div key={field.key}>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {field.label}
                </dt>
                <dd
                  className={`mt-1 text-sm text-slate-800 ${
                    field.variant === "multiline" ? "whitespace-pre-wrap" : ""
                  }`}
                >
                  {String(record.properties[field.key] ?? "-")}
                </dd>
              </div>
            ))}
          </dl>

          <div className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
            Next: add shortlist actions, secure-share link controls, and client feedback.
          </div>
        </div>
      )}
    </aside>
  );
}
