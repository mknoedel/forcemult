/**
 * Helper functions for generate-docs.js.
 *
 * Extracts leading doc comments and export names from TypeScript/JavaScript
 * source files, builds ASCII directory trees, and collects module index data.
 */

const fs = require('node:fs');
const path = require('node:path');

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'coverage',
  'dist',
  'build',
  'fixtures',
  'results',
]);

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

function isSourceFile(name) {
  if (/\.(test|spec)\.[tj]sx?$/.test(name)) return false;
  if (name.endsWith('.d.ts')) return false;
  return SOURCE_EXTENSIONS.has(path.extname(name).toLowerCase());
}

// ---------------------------------------------------------------------------
// Description & Export Extraction
// ---------------------------------------------------------------------------

/**
 * Extract the first description line from a file's leading JSDoc/block comment.
 * @param {string} filePath - Absolute path to a source file
 * @returns {string} Description text, or empty string
 */
function extractDescription(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }

  const multiLine = content.match(/\/\*\*?\s*\n([\s\S]*?)\*\//);
  if (multiLine) {
    const lines = multiLine[1].split('\n');
    for (const line of lines) {
      const cleaned = line.replace(/^\s*\*\s?/, '').trim();
      if (cleaned && !cleaned.startsWith('@')) {
        return cleaned;
      }
    }
  }

  const singleLine = content.match(/\/\*\*\s+(.+?)\s*\*\//);
  if (singleLine) {
    const text = singleLine[1].replace(/\s*\*\/$/, '').trim();
    if (!text.startsWith('@')) return text;
  }
  return '';
}

/**
 * Extract exported names from an ES/TS module (capped at 5).
 * Handles `export function/const/class/type/interface NAME`,
 * `export default ...`, and `export { a, b as c }`.
 * @param {string} filePath - Absolute path to a source file
 * @returns {string[]} Array of export names (max 5)
 */
function extractExports(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  const names = new Set();

  const declRe =
    /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = declRe.exec(content)) !== null) {
    names.add(m[1]);
  }

  const groupRe = /export\s*\{([^}]*)\}/g;
  while ((m = groupRe.exec(content)) !== null) {
    for (const part of m[1].split(',')) {
      const token = part
        .trim()
        .split(/\s+as\s+/)
        .pop();
      const clean = (token || '').trim();
      if (clean && clean !== 'default' && /^[A-Za-z_$][\w$]*$/.test(clean)) {
        names.add(clean);
      }
    }
  }

  if (/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/.test(content)) {
    // already captured by declRe
  } else if (/export\s+default\b/.test(content)) {
    names.add('default');
  }

  return [...names].slice(0, 5);
}

// ---------------------------------------------------------------------------
// Directory Tree Builder
// ---------------------------------------------------------------------------

/**
 * Build an ASCII directory tree with description annotations.
 * @param {string} rootDir - Project root directory
 * @param {string[]} dirs - Top-level directories to include (e.g. ['app/', 'lib/'])
 * @returns {string} ASCII tree string
 */
function buildDirectoryTree(rootDir, dirs) {
  const lines = [];
  for (const dir of dirs) {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    lines.push(dir);
    buildTreeRecursive(fullPath, '', lines);
  }
  return lines.join('\n');
}

function buildTreeRecursive(dirPath, prefix, lines) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  entries = entries.filter((e) => {
    if (e.name.startsWith('.')) return false;
    if (e.isDirectory() && SKIP_DIRS.has(e.name)) return false;
    return true;
  });

  const sortedDirs = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  const sortedFiles = entries
    .filter((e) => e.isFile())
    .sort((a, b) => a.name.localeCompare(b.name));
  const sorted = [...sortedDirs, ...sortedFiles];

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const isLast = i === sorted.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    if (entry.isDirectory()) {
      lines.push(`${prefix}${connector}${entry.name}/`);
      buildTreeRecursive(
        path.join(dirPath, entry.name),
        prefix + childPrefix,
        lines
      );
    } else {
      let annotation = '';
      if (isSourceFile(entry.name)) {
        const desc = extractDescription(path.join(dirPath, entry.name));
        if (desc) {
          annotation = `  # ${desc}`;
        }
      }
      lines.push(`${prefix}${connector}${entry.name}${annotation}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Module Index Builder
// ---------------------------------------------------------------------------

/**
 * Build a markdown table of modules from the given source directories.
 * @param {string} rootDir - Project root directory
 * @param {string[]} dirs - Top-level directories to scan (e.g. ['app/', 'lib/'])
 * @returns {string} Markdown table
 */
function buildModuleIndex(rootDir, dirs) {
  const rows = [];
  for (const dir of dirs) {
    const dirName = dir.replace(/\/$/, '');
    collectModules(path.join(rootDir, dirName), rows, dirName);
  }

  const header = '| Module | Purpose | Key Exports |';
  const sep = '|--------|---------|-------------|';
  const dataRows = rows.map(
    (r) => `| \`${r.module}\` | ${r.purpose} | ${r.exports} |`
  );
  return [header, sep, ...dataRows].join('\n');
}

function collectModules(dirPath, rows, relPrefix) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  const sortedDirs = entries
    .filter(
      (e) =>
        e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith('.')
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const sortedFiles = entries
    .filter((e) => e.isFile() && isSourceFile(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const file of sortedFiles) {
    const fullPath = path.join(dirPath, file.name);
    const modulePath = relPrefix ? `${relPrefix}/${file.name}` : file.name;
    const desc = extractDescription(fullPath);
    const exps = extractExports(fullPath);
    rows.push({
      module: modulePath,
      purpose: desc || '',
      exports: exps.map((e) => `\`${e}\``).join(', '),
    });
  }

  for (const dir of sortedDirs) {
    collectModules(
      path.join(dirPath, dir.name),
      rows,
      relPrefix ? `${relPrefix}/${dir.name}` : dir.name
    );
  }
}

module.exports = {
  SKIP_DIRS,
  isSourceFile,
  extractDescription,
  extractExports,
  buildDirectoryTree,
  buildModuleIndex,
};
