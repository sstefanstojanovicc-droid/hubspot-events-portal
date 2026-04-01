import type { PortalConfig } from "@/src/types/platform";

export const candidatePortalConfig: PortalConfig = {
  id: "candidate-portal",
  name: "Candidate Portal",
  description:
    "Reusable candidate shortlist workspace powered by HubSpot CRM records.",
  modules: [
    {
      id: "candidates",
      objectType: "2-39167811",
      title: "Candidates",
      subtitle: "Build and share client-ready shortlists from CRM profiles.",
      listFields: [
        { key: "current_title", label: "Current title" },
        { key: "location", label: "Location", variant: "badge" },
        { key: "gender", label: "Gender", variant: "badge" },
      ],
      detailFields: [
        { key: "summary", label: "Summary", variant: "multiline" },
        { key: "current_title", label: "Current title" },
        { key: "location", label: "Location" },
        { key: "gender", label: "Gender" },
      ],
      filterFields: [
        { key: "location", label: "Location", type: "text" },
        {
          key: "gender",
          label: "Gender",
          type: "select",
          options: [
            { label: "Any", value: "" },
            { label: "Female", value: "female" },
            { label: "Male", value: "male" },
            { label: "Non-binary", value: "non_binary" },
          ],
        },
      ],
      linkedObjectTypes: ["contacts", "companies", "deals"],
    },
  ],
};
