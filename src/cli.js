/**
 * env-sentinel: CLI Interface
 */

import { parseArgs } from 'node:util';
import { resolve, join } from 'node:path';
import { writeFileSync, readFileSync } from 'node:fs';
import { auditEnvironment } from './auditor.js';
import { parseDotenv } from './parser.js';
import { buildExampleFileContent } from './autofix.js';

export async function runCli(argv = process.argv.slice(2)) {
  const options = {
    help: { type: 'boolean', short: 'h', default: false },
    version: { type: 'boolean', short: 'v', default: false },
    env: { type: 'string', short: 'e', default: '.env' },
    example: { type: 'string', short: 'x', default: '.env.example' },
    'fix-example': { type: 'boolean', default: false },
    strict: { type: 'boolean', default: false },
    json: { type: 'boolean', default: false }
  };

  let parsed;
  try {
    parsed = parseArgs({ args: argv, options, allowPositionals: true });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    printHelp();
    return 0;
  }

  if (values.version) {
    console.log('env-sentinel v1.0.0');
    return 0;
  }

  const rootDir = resolve(positionals[0] || '.');

  const report = await auditEnvironment(rootDir, {
    envFile: values.env,
    exampleFile: values.example
  });

  if (values['fix-example']) {
    const examplePath = join(rootDir, values.example);
    let existingVars = new Map();
    try {
      existingVars = parseDotenv(readFileSync(examplePath, 'utf8'));
    } catch {
      // Create fresh
    }

    const allNeeded = [...report.codeVars, ...report.envVars];
    const newExampleContent = buildExampleFileContent(allNeeded, existingVars);
    writeFileSync(examplePath, newExampleContent, 'utf8');
    console.log(`[OK] Updated "${values.example}" with all required keys (zero secrets leaked).`);
    return 0;
  }

  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
    if (values.strict && report.hasIssues) process.exit(1);
    return 0;
  }

  printHumanReport(report, values);

  if (values.strict && report.hasIssues) {
    process.exit(1);
  }

  return 0;
}

function printHumanReport(report, values) {
  console.log('\n--- env-sentinel Audit Report ---');
  console.log('============================================================');
  console.log(`Variables referenced in code:  ${report.stats.totalCodeVariables}`);
  console.log(`Variables defined in ${values.env}:       ${report.stats.totalEnvVariables}`);
  console.log(`Variables documented in ${values.example}: ${report.stats.totalExampleVariables}\n`);

  let issueCount = 0;

  if (report.missingInExample.length > 0) {
    issueCount += report.missingInExample.length;
    console.log(`[ERROR] Missing from "${values.example}" (${report.missingInExample.length}):`);
    for (const item of report.missingInExample) {
      const loc = item.occurrences[0] ? ` (used in ${item.occurrences[0].file}:${item.occurrences[0].line})` : '';
      console.log(`   - ${item.key}${loc}`);
    }
    console.log('   -> Tip: Run `env-sentinel --fix-example` to automatically add safe placeholders.\n');
  }

  if (report.missingInEnv.length > 0) {
    issueCount += report.missingInEnv.length;
    console.log(`[WARN]  Referenced in code but missing from "${values.env}" (${report.missingInEnv.length}):`);
    for (const item of report.missingInEnv) {
      console.log(`   - ${item.key}`);
    }
    console.log('');
  }

  if (report.unusedInEnv.length > 0) {
    console.log(`ℹ️  Dead variables in "${values.env}" (never referenced in code) (${report.unusedInEnv.length}):`);
    for (const key of report.unusedInEnv) {
      console.log(`   - ${key}`);
    }
    console.log('');
  }

  if (issueCount === 0) {
    console.log('[OK] Environment schema is fully in sync! No missing variables detected.');
  }
  console.log('============================================================\n');
}

function printHelp() {
  console.log(`
env-sentinel - Zero-Leak Environment Variable & Schema Drift Auditor

USAGE:
  $ env-sentinel [flags] [directory]

FLAGS:
  -e, --env <file>        Path to local .env file (default: .env)
  -x, --example <file>    Path to schema template (default: .env.example)
      --fix-example       Automatically add missing keys to .env.example safely
      --strict            Exit with code 1 if missing variables exist (ideal for CI)
      --json              Output structured JSON report
  -v, --version           Show version
  -h, --help              Show help

EXAMPLES:
  # Audit environment drift in current repo:
  $ env-sentinel

  # Run in CI pipeline and fail if .env.example is out of sync:
  $ env-sentinel --strict

  # Safely sync missing keys into .env.example:
  $ env-sentinel --fix-example
`);
}

