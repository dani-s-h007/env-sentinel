# env-sentinel 🔐

[![CI](https://github.com/dani-s-h007/env-sentinel/actions/workflows/ci.yml/badge.svg)](https://github.com/dani-s-h007/env-sentinel/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)

> **Zero-leak environment variable & schema drift auditor with static code analysis and auto-fixing.**

Missing environment variables in production are one of the most common causes of runtime crashes following a deployment. Conversely, outdated or undocumented `.env.example` templates make onboarding new developers painful. `env-sentinel` scans your entire codebase, audits `.env` and `.env.example` against actual usage, and safely generates updated templates without ever leaking secret values.

---

## ✨ Features

- **Multi-Language Static Scanner**: Detects env variables in JS, TypeScript, JSX, TSX (`process.env.X`, `import.meta.env.X`), Python (`os.environ[...]`, `os.getenv(...)`), and Go (`os.Getenv(...)`).
- **Deep Drift Detection**:
  - Catches variables used in code but missing from `.env.example` (prevents broken production deployments).
  - Catches dead / obsolete variables lingering in `.env` files.
  - Pinpoints the exact file and line number where each variable is referenced.
- **Safe Auto-Fixer (`--fix-example`)**: Automatically builds or updates `.env.example` with context-aware placeholders (ports get `3000`, URLs get dummy connection strings, secrets get `your_key_here`) with zero risk of secret leakage.
- **CI / Git Hook Enforcement (`--strict`)**: Returns exit code 1 when schema drift is detected, blocking PRs before bad configs hit production.
- **Zero Runtime Dependencies**: Ultra-fast execution with zero third-party dependencies.

---

## 🚀 Installation

```bash
# Run instantly with npx
npx env-sentinel --help

# Or install globally
npm install -g env-sentinel
```

---

## 🛠️ CLI Usage

### Basic Audit
```bash
# Run audit in the current project:
env-sentinel
```

### Auto-Sync .env.example
```bash
# Automatically add missing keys with safe dummy placeholders:
env-sentinel --fix-example
```

### Continuous Integration (CI) Check
```bash
# Fail CI build if any code variables are missing from .env.example:
env-sentinel --strict
```

### Export JSON Report
```bash
env-sentinel --json > env-report.json
```

---

## 💻 Programmatic TypeScript API

```typescript
import { auditEnvironment, buildExampleFileContent } from 'env-sentinel';

const report = await auditEnvironment('./my-service', {
  envFile: '.env',
  exampleFile: '.env.example'
});

if (report.hasIssues) {
  console.log('Missing variables in .env.example:');
  report.missingInExample.forEach((item) => {
    console.log(`- ${item.key} (used in ${item.occurrences[0].file})`);
  });
}
```

---

## 🧪 Testing

```bash
npm test
```

---

## 📄 License

MIT © Essentials Toolkit Authors

