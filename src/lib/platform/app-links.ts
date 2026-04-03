import type { AppDefinition } from "@/src/types/platform-tenant";

export function clientAppHref(app: AppDefinition, clientSlug: string): string {
  if (app.clientWorkspacePath?.trim()) {
    return `/clients/${clientSlug}/${app.clientWorkspacePath.trim()}`;
  }
  return app.route;
}
