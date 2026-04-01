import { searchBoardBlueprint } from "@/src/config/blueprints/search-board";
import type { AppInstallBlueprint } from "@/src/types/app-install-blueprint";

const blueprintsById: Record<string, AppInstallBlueprint> = {
  [searchBoardBlueprint.id]: searchBoardBlueprint,
};

export function getBlueprintById(id: string): AppInstallBlueprint | undefined {
  return blueprintsById[id];
}

export function listBlueprints(): AppInstallBlueprint[] {
  return Object.values(blueprintsById);
}
