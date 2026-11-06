import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDotenv } from '../src/parser.js';
import { extractEnvVarsFromContent } from '../src/scanner.js';
import { generateSafeDummyValue, buildExampleFileContent } from '../src/autofix.js';

describe('env-sentinel', () => {
  describe('parseDotenv', () => {
    it('parses unquoted and quoted values while ignoring comments', () => {
      const sample = `
# Server configuration
PORT=8080 # default port
HOST="127.0.0.1"
API_KEY='sk-test-1234'
EMPTY_VAL=
      `;

      const parsed = parseDotenv(sample);
      assert.equal(parsed.get('PORT').value, '8080');
      assert.equal(parsed.get('HOST').value, '127.0.0.1');
      assert.equal(parsed.get('API_KEY').value, 'sk-test-1234');
      assert.equal(parsed.get('EMPTY_VAL').value, '');
      assert.equal(parsed.size, 4);
    });
  });

  describe('extractEnvVarsFromContent', () => {
    it('detects process.env properties across JS/TS/Py/Go', () => {
      const jsCode = `
        const port = process.env.PORT || 3000;
        const secret = process.env['STRIPE_SECRET_KEY'];
        const url = import.meta.env.VITE_API_URL;
      `;

      const found = extractEnvVarsFromContent(jsCode, 'app.ts');
      assert.ok(found.has('PORT'));
      assert.ok(found.has('STRIPE_SECRET_KEY'));
      assert.ok(found.has('VITE_API_URL'));
    });

    it('detects Python and Go env usages', () => {
      const pyCode = `
        import os
        db_url = os.environ.get('DATABASE_URL')
        jwt_key = os.getenv('JWT_SECRET')
      `;

      const found = extractEnvVarsFromContent(pyCode, 'server.py');
      assert.ok(found.has('DATABASE_URL'));
      assert.ok(found.has('JWT_SECRET'));
    });
  });

  describe('autofix', () => {
    it('generates context-aware safe dummy placeholders', () => {
      assert.equal(generateSafeDummyValue('PORT'), '3000');
      assert.equal(generateSafeDummyValue('DATABASE_URL'), 'postgresql://user:password@localhost:5432/dbname');
      assert.equal(generateSafeDummyValue('STRIPE_SECRET_KEY'), 'your_stripe_secret_key_here');
      assert.equal(generateSafeDummyValue('IS_PRODUCTION'), 'false');
    });

    it('builds clean .env.example without leaking real values', () => {
      const keys = ['PORT', 'DATABASE_URL', 'AUTH_SECRET'];
      const content = buildExampleFileContent(keys);

      assert.ok(content.includes('PORT=3000'));
      assert.ok(content.includes('DATABASE_URL=postgresql://user:password@localhost:5432/dbname'));
      assert.ok(content.includes('AUTH_SECRET=your_auth_secret_here'));
    });
  });
});

