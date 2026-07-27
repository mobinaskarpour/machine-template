export class NotImplementedError extends Error {
  readonly code = "NOT_IMPLEMENTED" as const;
  constructor(service: string, method: string) {
    super(`${service}.${method} is not implemented yet`);
    this.name = "NotImplementedError";
  }
}

export interface IndustryEngine {
  resolve(companyId: string): Promise<never>;
}

export interface MasterPromptBuilder {
  build(companyId: string): Promise<never>;
}

export interface BlueprintGenerator {
  generate(companyId: string): Promise<never>;
}

export interface CompanyOSGenerator {
  generate(companyId: string): Promise<never>;
}

export interface QualityEvaluator {
  evaluate(projectId: string): Promise<never>;
}

export interface DeploymentService {
  deploy(projectId: string): Promise<never>;
}

export interface EditService {
  apply(companyId: string, request: string): Promise<never>;
}

export interface OperationsService {
  run(companyId: string, action: string): Promise<never>;
}

export type GenerationRequest = {
  companyId: string;
  projectId: string;
  prompt: string;
  workspacePath: string;
};

export type GenerationResult = {
  filesWritten: string[];
  summary: string;
};

export interface CodeGenerationProvider {
  generate(input: GenerationRequest): Promise<GenerationResult>;
}

export const notImplementedIndustry: IndustryEngine = {
  async resolve() {
    throw new NotImplementedError("IndustryEngine", "resolve");
  },
};

export const notImplementedMasterPrompt: MasterPromptBuilder = {
  async build() {
    throw new NotImplementedError("MasterPromptBuilder", "build");
  },
};

export const notImplementedBlueprint: BlueprintGenerator = {
  async generate() {
    throw new NotImplementedError("BlueprintGenerator", "generate");
  },
};

export const notImplementedOsGenerator: CompanyOSGenerator = {
  async generate() {
    throw new NotImplementedError("CompanyOSGenerator", "generate");
  },
};

export const notImplementedQuality: QualityEvaluator = {
  async evaluate() {
    throw new NotImplementedError("QualityEvaluator", "evaluate");
  },
};

export const notImplementedDeploy: DeploymentService = {
  async deploy() {
    throw new NotImplementedError("DeploymentService", "deploy");
  },
};

export const notImplementedEdit: EditService = {
  async apply() {
    throw new NotImplementedError("EditService", "apply");
  },
};

export const notImplementedOps: OperationsService = {
  async run() {
    throw new NotImplementedError("OperationsService", "run");
  },
};

export const notImplementedCodegen: CodeGenerationProvider = {
  async generate() {
    throw new NotImplementedError("CodeGenerationProvider", "generate");
  },
};
