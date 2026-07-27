import type { JobRepository } from "../persistence/job-repository.js";
import type { JobRecord, JobStatus, JobType } from "../shared/schemas.js";
import { AppError } from "../shared/errors.js";
import { newId, nowIso } from "../shared/ids.js";
import type { Logger } from "pino";
import { withJobContext } from "../logging/logger.js";

const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  QUEUED: ["RUNNING", "CANCELLED"],
  RUNNING: ["SUCCEEDED", "FAILED", "CANCELLED"],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

export class JobManager {
  constructor(
    private readonly jobs: JobRepository,
    private readonly logger: Logger,
  ) {}

  async create(input: {
    type: JobType;
    companyId?: string;
    projectId?: string;
    input: Record<string, unknown>;
    currentStage?: string;
  }): Promise<JobRecord> {
    const timestamp = nowIso();
    const record: JobRecord = {
      id: newId("job"),
      type: input.type,
      companyId: input.companyId,
      projectId: input.projectId,
      status: "QUEUED",
      currentStage: input.currentStage ?? "queued",
      progress: 0,
      input: input.input,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const created = await this.jobs.create(record);
    withJobContext(this.logger, {
      jobId: created.id,
      companyId: created.companyId,
      projectId: created.projectId,
    }).info({ type: created.type }, "job.created");
    return created;
  }

  async transition(id: string, to: JobStatus): Promise<JobRecord> {
    const current = await this.require(id);
    const allowed = ALLOWED_TRANSITIONS[current.status];
    if (!allowed.includes(to)) {
      throw new AppError(
        "INVALID_STATE_TRANSITION",
        `Cannot transition job ${id} from ${current.status} to ${to}`,
        { details: { from: current.status, to } },
      );
    }

    const patch: Partial<JobRecord> = {
      status: to,
      updatedAt: nowIso(),
    };
    if (to === "RUNNING") {
      patch.startedAt = nowIso();
      patch.currentStage = current.currentStage ?? "running";
    }
    if (to === "SUCCEEDED" || to === "FAILED" || to === "CANCELLED") {
      patch.finishedAt = nowIso();
      if (to === "SUCCEEDED") {
        patch.progress = 100;
      }
    }

    const updated = await this.jobs.update(id, patch);
    withJobContext(this.logger, {
      jobId: updated.id,
      companyId: updated.companyId,
      projectId: updated.projectId,
      stage: updated.currentStage,
    }).info({ from: current.status, to }, "job.transition");
    return updated;
  }

  async setStage(
    id: string,
    stage: string,
    progress?: number,
  ): Promise<JobRecord> {
    const current = await this.require(id);
    if (current.status !== "RUNNING" && current.status !== "QUEUED") {
      throw new AppError(
        "INVALID_STATE_TRANSITION",
        `Cannot set stage on job in status ${current.status}`,
      );
    }
    return this.jobs.update(id, {
      currentStage: stage,
      progress: progress ?? current.progress,
      updatedAt: nowIso(),
    });
  }

  async succeed(
    id: string,
    output?: Record<string, unknown>,
  ): Promise<JobRecord> {
    await this.transition(id, "SUCCEEDED");
    return this.jobs.update(id, {
      output: output ?? {},
      progress: 100,
      finishedAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  async fail(
    id: string,
    error: { code: string; message: string; stack?: string },
  ): Promise<JobRecord> {
    const current = await this.require(id);
    if (current.status === "QUEUED") {
      await this.transition(id, "RUNNING");
    }
    await this.transition(id, "FAILED");
    return this.jobs.update(id, {
      error,
      finishedAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  async get(id: string): Promise<JobRecord | null> {
    return this.jobs.getById(id);
  }

  async require(id: string): Promise<JobRecord> {
    const job = await this.jobs.getById(id);
    if (!job) {
      throw new AppError("NOT_FOUND", `Job not found: ${id}`);
    }
    return job;
  }
}
