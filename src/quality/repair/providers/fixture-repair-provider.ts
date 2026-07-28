import type {
  RepairProvider,
  RepairProviderInput,
  RepairProviderResult,
} from "./repair-provider.js";

/**
 * No-op / minimal repair provider for tests.
 */
export class FixtureRepairProvider implements RepairProvider {
  readonly providerId = "FIXTURE";

  async repair(_input: RepairProviderInput): Promise<RepairProviderResult> {
    void _input;
    return {
      filesChanged: [],
      notes: "Fixture repair provider — no changes",
    };
  }
}
