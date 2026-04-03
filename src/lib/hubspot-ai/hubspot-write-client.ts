/**
 * HubSpot write API abstraction — only invoked from the execution runner.
 * Phase 3: implement property/workflow mutations using HUBSPOT_ACCESS_TOKEN.
 */
export class HubSpotWriteClient {
  constructor(readonly hubspotPortalId: string) {}

  // Reserved for real HubSpot calls; execution is simulated until Phase 3.
}
