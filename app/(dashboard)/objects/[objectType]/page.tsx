import { notFound } from "next/navigation";
import { FilterBar } from "@/src/components/platform/filter-bar";
import { RecordDetailPanel } from "@/src/components/platform/record-detail-panel";
import { RecordList } from "@/src/components/platform/record-list";
import { getObjectModule } from "@/src/config/portal-registry";
import { loadObjectRecords } from "@/src/lib/platform/data";

interface ObjectPageProps {
  params: Promise<{ objectType: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ObjectPage({ params, searchParams }: ObjectPageProps) {
  const { objectType } = await params;
  const query = await searchParams;
  const resolved = getObjectModule(objectType);

  if (!resolved) {
    notFound();
  }

  const selectedId = typeof query.recordId === "string" ? query.recordId : undefined;
  const state = {
    search: typeof query.search === "string" ? query.search : "",
    values: Object.fromEntries(
      resolved.module.filterFields.map((field) => {
        const queryValue = query[field.key];
        return [field.key, typeof queryValue === "string" ? queryValue : ""];
      }),
    ),
  };

  const data = await loadObjectRecords(objectType, state);
  const selectedRecord =
    data.records.find((record) => record.id === selectedId) ?? data.records[0] ?? null;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold text-slate-900">{data.module.title}</h2>
        <p className="text-sm text-slate-600">{data.module.subtitle}</p>
      </header>

      <FilterBar fields={data.module.filterFields} state={state} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <RecordList
            title={`${data.module.title} list`}
            records={data.listItems}
            selectedId={selectedRecord?.id}
          />
        </div>
        <div className="xl:col-span-4">
          <RecordDetailPanel
            title="Record detail panel"
            record={selectedRecord}
            fields={data.module.detailFields}
          />
        </div>
      </section>
    </div>
  );
}
