export type DeploymentProviderStartInput = {
  processName: string;
  appDir: string;
  port: number;
  env: Record<string, string>;
};

export type DeploymentProviderStatus = {
  name: string;
  status: "online" | "stopped" | "errored" | "unknown";
  pid?: number;
  restarts: number;
  uptimeMs?: number;
};

export type DeploymentProviderLogs = {
  out: string[];
  err: string[];
};

/**
 * Process-supervisor abstraction. The only production implementation is
 * Pm2DeploymentProvider; tests inject a mock implementing this interface.
 */
export interface DeploymentProvider {
  start(input: DeploymentProviderStartInput): Promise<DeploymentProviderStatus>;
  stop(processName: string): Promise<void>;
  restart(processName: string): Promise<DeploymentProviderStatus>;
  delete(processName: string): Promise<void>;
  describe(processName: string): Promise<DeploymentProviderStatus | null>;
  logs(processName: string, lines: number): Promise<DeploymentProviderLogs>;
}
