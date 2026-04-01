export type HubSpotProperties = Record<string, string | null | undefined>;

export interface SearchBoardTenantObjects {
  clientId: string;
  candidateTypeId: string;
  shortlistTypeId: string;
  entryTypeId: string;
  associationEntryToShortlistTypeId?: string;
  associationEntryToCandidateTypeId?: string;
}

export interface ShortlistRecord {
  id: string;
  properties: HubSpotProperties;
}

export interface CandidateRecord {
  id: string;
  properties: HubSpotProperties;
}

export interface ShortlistEntryRecord {
  id: string;
  properties: HubSpotProperties;
}

/** Wire format for persisting the ranked builder (five slots; index 0 = rank 1). */
export type ShortlistDraftSlotWire = {
  rank: number;
  candidateId: string;
  entryId: string | null;
  shortlistStatus: string;
  clientFeedback: string;
  internalNotes: string;
};

/** Joined row for board / table. */
export interface ShortlistBoardItem {
  entryId: string;
  candidateId: string;
  rank: number;
  entryName?: string;
  shortlistStatus: string;
  candidateName: string;
  currentTitle: string;
  location: string;
  candidateStatus: string;
  summaryPreview: string;
  clientFeedbackPreview: string;
  /** Full values for edit forms */
  clientFeedback?: string;
  internalNotes?: string;
  hasInternalNotes: boolean;
  lastModified?: string;
}
