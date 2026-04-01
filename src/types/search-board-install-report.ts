export type SearchBoardInstallCounts = {
  schemasCreated: number;
  schemasSkipped: number;
  groupsCreated: number;
  groupsSkipped: number;
  propertiesCreated: number;
  propertiesSkipped: number;
  associationsCreated: number;
  associationsSkipped: number;
};

export type SearchBoardInstallReport = {
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  failedStep?: string;
  httpStatus?: number;
  hubspotMessage?: string;
  counts: SearchBoardInstallCounts;
  log: string[];
  /** Resolved HubSpot object type ids per blueprint objectKey after run */
  objectTypeIds: Record<string, string>;
};
