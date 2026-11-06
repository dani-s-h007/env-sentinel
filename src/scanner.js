/**
 * env-sentinel: Codebase Static Scanner
 * Extracts environment variable references from source code files.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';

const SUPPORTED_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs']);

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  'vendor'
]);

// Patterns for environment variable extraction across multiple languages
const PATTERNS = [
  // JS/TS: process.env.KEY or process.env['KEY'] or process.env["KEY"]
  /\bprocess\.env\.(?<key>[A-Za-z_][A-Za-z0-9_]*)\b/g,
  /\bprocess\.env\[['"](?<key>[A-Za-z_][A-Za-z0-9_]*)['"]\]/g,
  // JS/TS import.meta.env.KEY
  /\bimport\.meta\.env\.(?<key>[A-Za-z_][A-Za-z0-9_]*)\b/g,
  // Python: os.environ['KEY'] or os.environ.get('KEY') or os.getenv('KEY')
  /\bos\.(?:environ(?:\[|\.get\()|getenv\()['"](?<key>[A-Za-z_][A-Za-z0-9_]*)['"]/g,
  // Go: os.Getenv("KEY") or os.LookupEnv("KEY")
  /\bos\.(?:Getenv|LookupEnv)\(["'](?<key>[A-Za-z_][A-Za-z0-9_]*)["']\)/g
];

/**
 * Scans a file's content for environment variables
 * @param {string} content
 * @param {string} filePath
 * @returns {Map<string, Array<{ file: string, line: number }>>}
 */
export function extractEnvVarsFromContent(content, filePath) {
  const findings = new Map();
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    for (const pattern of PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const key = match.groups?.key;
        if (key && !key.startsWith('npm_') && key !== 'NODE_ENV') {
          if (!findings.has(key)) {
            findings.set(key, []);
          }
          findings.get(key).push({
            file: filePath,
            line: lineNum + 1
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Recursively scans directory for env var references in source files
 * @param {string} rootDir
 */
export async function scanSourceCode(rootDir) {
  const combined = new Map();

  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          try {
            const content = await readFile(fullPath, 'utf8');
            const relPath = relative(rootDir, fullPath);
            const found = extractEnvVarsFromContent(content, relPath);

            for (const [key, occurrences] of found.entries()) {
              if (!combined.has(key)) combined.set(key, []);
              combined.get(key).push(...occurrences);
            }
          } catch {
            // Ignore unreadable files
          }
        }
      }
    }
  }

  await walk(rootDir);
  return combined;
}

