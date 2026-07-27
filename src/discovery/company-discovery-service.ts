import type { DiscoveryInput, DiscoveryResult } from "./discovery-orchestrator.js";
import type { DiscoveryOrchestrator } from "./discovery-orchestrator.js";

/** Application-facing discovery service used by Telegram and CLI. */
export class CompanyDiscoveryService {
  constructor(private readonly orchestrator: DiscoveryOrchestrator) {}

  async discover(input: DiscoveryInput): Promise<DiscoveryResult> {
    return this.orchestrator.discover(input);
  }
}
