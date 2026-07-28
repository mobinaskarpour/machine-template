import { redactSecrets } from "../security/redact.js";
import type { DeploymentProvider, DeploymentProviderLogs } from "./providers/deployment-provider.js";

const ABS_PATH_RE = /(?:\/(?:root|home|Users|var|tmp|opt)\/[^\s:]+)/g;
const PM2_META_RE = /^\/[^\s]*\.pm2\/logs\/[^\n]*$/;

function sanitizeLogLine(line: string): string {
  let out = redactSecrets(line);
  if (PM2_META_RE.test(out.trim()) || out.includes("[TAILING]")) {
    return "";
  }
  out = out.replace(ABS_PATH_RE, "[path]");
  return out;
}

/** Fetch pm2 logs and redact secrets + absolute paths before they leave the process. */
export async function fetchSanitizedLogs(
  provider: DeploymentProvider,
  processName: string,
  lines = 100,
): Promise<DeploymentProviderLogs> {
  const logs = await provider.logs(processName, lines);
  const out = logs.out
    .map(sanitizeLogLine)
    .filter((l) => l.length > 0)
    .slice(-Math.min(lines, 80));
  const err = logs.err
    .map(sanitizeLogLine)
    .filter((l) => l.length > 0)
    .slice(-Math.min(lines, 40));
  return { out, err };
}
