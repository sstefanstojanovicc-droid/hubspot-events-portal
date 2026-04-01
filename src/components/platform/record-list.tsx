import type { RecordListItem } from "@/src/types/platform";

interface RecordListProps {
  title: string;
  records: RecordListItem[];
  selectedId?: string;
}

export function RecordList({ title, records, selectedId }: RecordListProps) {
  return (
    <section className="rounded-lg border border-slate-200">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </header>
      <ul className="divide-y divide-slate-200">
        {records.map((record) => {
          const active = record.id === selectedId;

          return (
            <li
              key={record.id}
              className={`px-4 py-3 ${active ? "bg-hub-muted" : "bg-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{record.title}</p>
                  <p className="text-xs text-slate-500">{record.subtitle}</p>
                </div>
                <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                  {record.objectType}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {record.fields.map((field) => (
                  <div key={field.label}>
                    <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                      {field.label}
                    </dt>
                    <dd
                      className={`mt-1 text-xs text-slate-700 ${
                        field.variant === "badge"
                          ? "inline-flex rounded bg-slate-100 px-2 py-1"
                          : ""
                      }`}
                    >
                      {field.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
