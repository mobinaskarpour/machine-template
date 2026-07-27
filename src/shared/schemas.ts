import { z } from "zod";
import { AppError } from "./errors.js";

export const CompanyStatusSchema = z.enum([
  "CREATED",
  "DISCOVERING",
  "READY",
  "GENERATING",
  "DEPLOYED",
  "FAILED",
]);

export const CompanyRecordSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  displayName: z.string().min(1),
  aliases: z.array(z.string()),
  status: CompanyStatusSchema,
  workspacePath: z.string().min(1),
  /** Preferred readable slug for future migration; never auto-renames workspace. */
  canonicalSlugSuggestion: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CompanyRecord = z.infer<typeof CompanyRecordSchema>;
export type CompanyStatus = z.infer<typeof CompanyStatusSchema>;

export const ProjectStatusSchema = z.enum([
  "INITIALIZED",
  "GENERATING",
  "BUILDING",
  "DEPLOYING",
  "RUNNING",
  "FAILED",
]);

export const ProjectRecordSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  slug: z.string().min(1),
  workspacePath: z.string().min(1),
  status: ProjectStatusSchema,
  deployment: z
    .object({
      provider: z.enum(["pm2", "docker"]).optional(),
      port: z.number().int().positive().optional(),
      processName: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProjectRecord = z.infer<typeof ProjectRecordSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const JobTypeSchema = z.enum([
  "DEMO",
  "EDIT",
  "OPS",
  "DISCOVERY",
  "GENERATION",
  "DEPLOYMENT",
]);

export const JobStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]);

export const JobRecordSchema = z.object({
  id: z.string().min(1),
  type: JobTypeSchema,
  companyId: z.string().optional(),
  projectId: z.string().optional(),
  status: JobStatusSchema,
  currentStage: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  input: z.record(z.unknown()),
  output: z.record(z.unknown()).optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});

export type JobRecord = z.infer<typeof JobRecordSchema>;
export type JobType = z.infer<typeof JobTypeSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;

export function parseCompanyRecord(data: unknown): CompanyRecord {
  const result = CompanyRecordSchema.safeParse(data);
  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid CompanyRecord", {
      details: { issues: result.error.issues },
    });
  }
  return result.data;
}

export function parseProjectRecord(data: unknown): ProjectRecord {
  const result = ProjectRecordSchema.safeParse(data);
  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid ProjectRecord", {
      details: { issues: result.error.issues },
    });
  }
  return result.data;
}

export function parseJobRecord(data: unknown): JobRecord {
  const result = JobRecordSchema.safeParse(data);
  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid JobRecord", {
      details: { issues: result.error.issues },
    });
  }
  return result.data;
}
