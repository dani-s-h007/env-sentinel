#!/usr/bin/env node
/**
 * env-sentinel: Interactive Live Demo
 */

import { extractEnvVarsFromContent } from '../src/scanner.js';
import { generateSafeDummyValue, buildExampleFileContent } from '../src/autofix.js';

console.log('\n=== [DEMO] Starting env-sentinel ===\n');

const sampleCode = `
import express from 'express';
const port = process.env.PORT || 3000;
const dbUri = process.env['DATABASE_URL'];
const stripeKey = process.env.STRIPE_SECRET_KEY;
const isDebug = process.env.DEBUG_MODE === 'true';
`;

console.log('Scanning Source Code File for process.env References:');
console.log('------------------------------------------------------------');
console.log(sampleCode.trim());
console.log('------------------------------------------------------------\n');

const extracted = extractEnvVarsFromContent(sampleCode, 'server.ts');
console.log(`Discovered ${extracted.size} Environment Variables in Code:`);
for (const [key, occurrences] of extracted.entries()) {
  console.log(` • ${key.padEnd(20)} (Line ${occurrences[0].line})`);
}

console.log('\nGenerating Sanitized Zero-Leak .env.example Template:');
console.log('------------------------------------------------------------');
const exampleContent = buildExampleFileContent(Array.from(extracted.keys()));
console.log(exampleContent);
console.log('------------------------------------------------------------');
console.log('[SUCCESS] Demo completed successfully.\n');

