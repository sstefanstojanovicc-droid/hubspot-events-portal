import type { FilterFieldConfig, PlatformFilterState } from "@/src/types/platform";

interface FilterBarProps {
  fields: FilterFieldConfig[];
  state: PlatformFilterState;
}

export function FilterBar({ fields, state }: FilterBarProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Filters
        </h2>
        <p className="text-xs text-slate-500">Config-driven by module schema</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Search</label>
          <input
            readOnly
            value={state.search ?? ""}
            placeholder="Search (wire to API)"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          />
        </div>

        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-xs font-medium text-slate-600">{field.label}</label>
            {field.type === "select" ? (
              <select
                value={state.values[field.key] ?? ""}
                disabled
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                readOnly
                value={state.values[field.key] ?? ""}
                placeholder={`Filter by ${field.label}`}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
