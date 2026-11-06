/**
 * env-sentinel: Core Audit Engine
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseDotenv } from './parser.js';
import { scanSourceCode } from './scanner.js';

export async function auditEnvironment(rootDir, options = {}) {
  const envPath = resolve(rootDir, options.envFile || '.env');
  const examplePath = resolve(rootDir, options.exampleFile || '.env.example');

  let envVars = new Map();
  let exampleVars = new Map();

  try {
    const envContent = await readFile(envPath, 'utf8');
    envVars = parseDotenv(envContent);
  } catch {
    // .env might not exist in CI or clean checkouts
  }

  try {
    const exampleContent = await readFile(examplePath, 'utf8');
    exampleVars = parseDotenv(exampleContent);
  } catch {
    // .env.example might be missing
  }

  const codeVars = await scanSourceCode(rootDir);

  const missingInEnv = [];
  const missingInExample = [];
  const unusedInEnv = [];

  // 1. Check code variables against .env and .env.example
  for (const [key, occurrences] of codeVars.entries()) {
    if (envVars.size > 0 && !envVars.has(key)) {
      missingInEnv.push({ key, occurrences });
    }
    if (!exampleVars.has(key)) {
      missingInExample.push({ key, occurrences });
    }
  }

  // 2. Check for dead/unused variables in .env
  for (const key of envVars.keys()) {
    if (!codeVars.has(key)) {
      unusedInEnv.push(key);
    }
  }

  // 3. Check for schema drift: variables in .env not documented in .env.example
  const unversionedInExample = [];
  for (const key of envVars.keys()) {
    if (!exampleVars.has(key)) {
      unversionedInExample.push(key);
    }
  }

  const hasIssues = missingInEnv.length > 0 || missingInExample.length > 0;

  return {
    hasIssues,
    codeVars: Array.from(codeVars.keys()),
    envVars: Array.from(envVars.keys()),
    exampleVars: Array.from(exampleVars.keys()),
    missingInEnv,
    missingInExample,
    unusedInEnv,
    unversionedInExample,
    stats: {
      totalCodeVariables: codeVars.size,
      totalEnvVariables: envVars.size,
      totalExampleVariables: exampleVars.size
    }
  };
}

