import type { AppInstallBlueprint } from "@/src/types/app-install-blueprint";

export type ProvisioningStepStatus = "missing" | "present" | "partial" | "unknown";

export interface ProvisioningObjectStep {
  blueprintObjectKey: string;
  schemaName: string;
  singularLabel: string;
  status: ProvisioningStepStatus;
  hubspotObjectTypeId?: string;
  detail?: string;
}

export interface ProvisioningPropertyStep {
  blueprintObjectKey: string;
  propertyName: string;
  label: string;
  status: ProvisioningStepStatus;
  expectedValueType?: string;
  expectedFieldType?: string;
  actualValueType?: string;
  actualFieldType?: string;
  detail?: string;
}

export interface ProvisioningAssociationStep {
  associationId: string;
  description?: string;
  status: ProvisioningStepStatus;
  fromLabel: string;
  toLabel: string;
  detail?: string;
}

export interface ProvisioningValidationResult {
  checkId: string;
  description: string;
  severity: "blocking" | "warning";
  passed: boolean;
  message?: string;
}

export interface ProvisioningTaskStep {
  taskId: string;
  title: string;
  optional?: boolean;
  status: "pending" | "ready_for_manual" | "done";
}

export interface ProvisioningInstallPlan {
  mode: "dry-run";
  clientId: string;
  blueprintId: string;
  blueprint: AppInstallBlueprint;
  hubspotSnapshotAvailable: boolean;
  hubspotSnapshotError?: string;
  objects: ProvisioningObjectStep[];
  properties: ProvisioningPropertyStep[];
  associations: ProvisioningAssociationStep[];
  validations: ProvisioningValidationResult[];
  tasks: ProvisioningTaskStep[];
  /** Ordered operations for a future execute phase (no mutations in dry-run). */
  proposedActions: ProvisioningProposedAction[];
  mappingPreview: Record<string, string | null>;
}

export type ProvisioningProposedAction =
  | {
      kind: "create_custom_object_schema";
      schemaName: string;
      labels: { singular: string; plural: string };
    }
  | {
      kind: "create_property";
      objectTypeTarget: string;
      property: string;
    }
  | {
      kind: "create_association";
      associationId: string;
    }
  | {
      kind: "manual_setup_task";
      taskId: string;
      title: string;
    };
