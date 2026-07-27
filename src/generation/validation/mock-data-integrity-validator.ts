import type { CompanyOSBlueprint } from "../../blueprints/company-os-blueprint-schema.js";
import { AppError } from "../../shared/errors.js";
import {
  validateInternalReferences,
  type MockDataBundle,
} from "../renderers/mock-data-renderer.js";

export type MockDataIntegrityResult = {
  ok: true;
  recordTotal: number;
};

/**
 * Validate mock records: references, nonnegative quantities, date ranges.
 */
export function validateMockDataIntegrity(input: {
  bundle: MockDataBundle;
  blueprint: CompanyOSBlueprint;
}): MockDataIntegrityResult {
  const { bundle, blueprint } = input;
  validateInternalReferences(bundle);

  const start = Date.parse(blueprint.mockDataPlan.timeRange.start);
  const end = Date.parse(blueprint.mockDataPlan.timeRange.end);
  const issues: string[] = [];
  let recordTotal = 0;

  for (const [entityId, rows] of Object.entries(bundle.records)) {
    recordTotal += rows.length;
    for (const row of rows) {
      for (const qtyField of ["quantity", "minutes", "amount", "totalAmount", "unitPrice"]) {
        const value = row[qtyField];
        if (typeof value === "number" && value < 0) {
          issues.push(`Negative ${qtyField} on ${entityId}/${row.id}`);
        }
      }
      const createdAt = row.createdAt;
      if (typeof createdAt === "string" && Number.isFinite(start) && Number.isFinite(end)) {
        const t = Date.parse(createdAt);
        if (Number.isFinite(t) && (t < start || t > end)) {
          issues.push(`Date out of range on ${entityId}/${row.id}: ${createdAt}`);
        }
      }
    }
  }

  if (issues.length > 0) {
    throw new AppError(
      "GENERATION_VALIDATION_FAILED",
      "Mock data integrity validation failed",
      { details: { issues: issues.slice(0, 40), recordTotal } },
    );
  }

  return { ok: true, recordTotal };
}
