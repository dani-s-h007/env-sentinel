export interface EnvAuditOptions {
  envFile?: string;
  exampleFile?: string;
}

export interface VariableOccurrence {
  file: string;
  line: number;
}

export interface MissingVariable {
  key: string;
  occurrences: VariableOccurrence[];
}

export interface EnvAuditReport {
  hasIssues: boolean;
  codeVars: string[];
  envVars: string[];
  exampleVars: string[];
  missingInEnv: MissingVariable[];
  missingInExample: MissingVariable[];
  unusedInEnv: string[];
  unversionedInExample: string[];
  stats: {
    totalCodeVariables: number;
    totalEnvVariables: number;
    totalExampleVariables: number;
  };
}

export declare function auditEnvironment(rootDir: string, options?: EnvAuditOptions): Promise<EnvAuditReport>;
export declare function parseDotenv(content: string): Map<string, { value: string; line: number; raw: string }>;
export declare function generateSafeDummyValue(key: string): string;
export declare function buildExampleFileContent(requiredKeys: string[], existingExampleVars?: Map<string, { value: string }>): string;

