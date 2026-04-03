import type { ToolActivity } from "@/src/lib/hubspot-ai/mock-assistant";

export type ChatMessageRow = {
  id: string;
  role: string;
  content: string;
  metadata: string;
  createdAt: Date;
};

function parseMeta(raw: string): {
  toolActivities?: ToolActivity[];
} {
  try {
    return JSON.parse(raw || "{}") as { toolActivities?: ToolActivity[] };
  } catch {
    return {};
  }
}

function formatAssistantBody(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={i} className="mt-3 text-sm font-semibold text-slate-900 first:mt-0">
          {trimmed.replace(/^###\s+/, "")}
        </h3>
      );
    }
    if (trimmed.startsWith("- ")) {
      return (
        <li key={i} className="ml-4 list-disc text-sm text-slate-700">
          {trimmed.slice(2)}
        </li>
      );
    }
    if (trimmed === "") {
      return <div key={i} className="h-2" />;
    }
    return (
      <p key={i} className="text-sm text-slate-700">
        {line}
      </p>
    );
  });
}

export function HubspotAiChatPanel({ messages }: { messages: ChatMessageRow[] }) {
  return (
    <div className="space-y-4">
      {messages.map((m) => {
        const isUser = m.role === "user";
        const meta = !isUser ? parseMeta(m.metadata) : {};
        return (
          <div
            key={m.id}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[min(100%,42rem)] rounded-xl px-4 py-3 ${
                isUser
                  ? "bg-hub-ink text-white"
                  : "border border-slate-200 bg-white shadow-sm"
              }`}
            >
              {meta.toolActivities && meta.toolActivities.length > 0 ? (
                <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-600">
                  <p className="font-semibold text-slate-500">Tool activity</p>
                  <ul className="mt-1 space-y-1">
                    {meta.toolActivities.map((t, idx) => (
                      <li key={idx}>
                        <span className="font-medium text-slate-700">{t.label}</span>
                        {t.detail ? (
                          <span className="text-slate-500"> — {t.detail}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {isUser ? (
                <p className="whitespace-pre-wrap text-sm">{m.content}</p>
              ) : (
                <div className="space-y-1">{formatAssistantBody(m.content)}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
