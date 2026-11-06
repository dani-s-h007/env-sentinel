/**
 * env-sentinel: Auto-Fixer & Dummy Generator
 * Generates safe, non-leaking dummy values for .env.example.
 */

export function generateSafeDummyValue(key) {
  const upper = key.toUpperCase();

  if (upper.includes('PORT')) return '3000';
  if (upper.includes('HOST')) return 'localhost';
  if (upper.includes('URL') || upper.includes('URI')) {
    if (upper.includes('DATABASE') || upper.includes('DB') || upper.includes('POSTGRES')) {
      return 'postgresql://user:password@localhost:5432/dbname';
    }
    if (upper.includes('REDIS')) return 'redis://localhost:6379';
    if (upper.includes('MONGO')) return 'mongodb://localhost:27017/dbname';
    return 'https://api.example.com';
  }
  if (upper.includes('SECRET') || upper.includes('KEY') || upper.includes('TOKEN')) {
    return 'your_' + key.toLowerCase() + '_here';
  }
  if (upper.includes('EMAIL')) return 'admin@example.com';
  if (upper.includes('ENABLE') || upper.includes('DEBUG') || upper.includes('IS_') || upper.includes('BOOL')) {
    return 'false';
  }
  if (upper.includes('TIMEOUT') || upper.includes('MAX') || upper.includes('LIMIT')) {
    return '1000';
  }

  return 'example_value';
}

/**
 * Builds clean .env.example content containing all needed variables
 * @param {string[]} requiredKeys
 * @param {Map<string, { value: string }>} [existingExampleVars]
 */
export function buildExampleFileContent(requiredKeys, existingExampleVars = new Map()) {
  const sortedKeys = Array.from(new Set(requiredKeys)).sort();
  const lines = [
    '# .env.example',
    '# Generated automatically by env-sentinel',
    '# Replace placeholder values with your local/testing credentials',
    ''
  ];

  for (const key of sortedKeys) {
    if (existingExampleVars.has(key)) {
      lines.push(`${key}=${existingExampleVars.get(key).value}`);
    } else {
      lines.push(`${key}=${generateSafeDummyValue(key)}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

