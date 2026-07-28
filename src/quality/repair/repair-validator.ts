import { listFilesRecursive } from "../../generation/generation-types.js";
import { AppError } from "../../shared/errors.js";
import { isAllowedRepairPath } from "./repair-file-policy.js";

export type RepairValidationResult = {
  ok: true;
  filesChanged: string[];
  fileCount: number;
};

/**
 * After repair: ensure changed paths are allowed; optionally scan staging for forbidden paths.
 */
export async function validateRepairOutput(input: {
  stagingAppDir: string;
  filesChanged: string[];
  /** When true, also reject any forbidden basename under staging (lightweight). */
  scanStaging?: boolean;
}): Promise<RepairValidationResult> {
  const badChanged = input.filesChanged.filter((p) => !isAllowedRepairPath(p));
  if (badChanged.length > 0) {
    throw new AppError(
      "QUALITY_REPAIR_FAILED",
      "Repair wrote paths outside the allowed repair policy",
      { details: { paths: badChanged.slice(0, 20) } },
    );
  }

  if (input.scanStaging) {
    const files = await listFilesRecursive(input.stagingAppDir);
    const forbidden = files
      .map((f) => f.path)
      .filter((p) => {
        const base = p.split("/").pop() ?? p;
        return (
          base === ".env" ||
          base.startsWith(".env.") ||
          base === "Dockerfile" ||
          base.startsWith("docker-compose") ||
          base.startsWith("ecosystem.config")
        );
      });
    if (forbidden.length > 0) {
      throw new AppError(
        "QUALITY_REPAIR_FAILED",
        "Repair staging contains forbidden control/deployment files",
        { details: { paths: forbidden.slice(0, 20) } },
      );
    }
  }

  const files = await listFilesRecursive(input.stagingAppDir);
  return {
    ok: true,
    filesChanged: [...input.filesChanged].sort(),
    fileCount: files.length,
  };
}
