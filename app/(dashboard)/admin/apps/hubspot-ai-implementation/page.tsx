import { redirect } from "next/navigation";

/** Default entry: global Knowledge Base; pick a client from the dropdown for client tabs. */
export default function HubspotAiImplementationIndexPage() {
  redirect("/admin/apps/hubspot-ai-implementation/knowledge-base");
}
