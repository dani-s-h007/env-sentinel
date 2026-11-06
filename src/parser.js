/**
 * env-sentinel: Dotenv Parser
 * Parses .env files into structured key-value maps while preserving metadata.
 */

export function parseDotenv(content) {
  const vars = new Map();
  if (typeof content !== 'string') return vars;

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines and full line comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let val = match[2];

    // Remove inline comments if unquoted
    if (!val.startsWith('"') && !val.startsWith("'")) {
      const hashIndex = val.indexOf('#');
      if (hashIndex !== -1) {
        val = val.slice(0, hashIndex).trim();
      }
    }

    // Strip wrapping quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    vars.set(key, {
      value: val,
      line: i + 1,
      raw: rawLine
    });
  }

  return vars;
}

