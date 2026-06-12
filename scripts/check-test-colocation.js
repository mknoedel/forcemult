#!/usr/bin/env node

/**
 * Test-presence enforcement for pre-commit hook (centralized `tests/` layout).
 *
 * This project keeps tests in a centralized tree (tests/unit + tests/integration)
 * that mirrors the source layout, rather than colocating test files next to source.
 * For each staged source module (pages, route handlers, lib utilities), this check
 * requires at least one matching test in the tests/ tree whose normalized path lines
 * up with the source path. Presentational components, generated UI primitives, type
 * declarations, and Next.js framework files are exempt (covered via page/integration
 * tests or have no behavior to test).
 *
 * Usage:
 *   node scripts/check-test-colocation.js          # Scans git staged files
 *   const { checkColocation } = require('./scripts/check-test-colocation'); # Library use
 */

const { execFileSync } = require('node:child_process');
const { readdirSync, readFileSync, existsSync, statSync } = require('node:fs');
const { resolve, extname, basename } = require('node:path');

const CONFIG = {
  // Source modules that must have a corresponding test.
  include: ['app/**/*.ts', 'app/**/*.tsx', 'lib/**/*.ts', 'lib/**/*.tsx'],
  // Files that do not require their own test.
  exclude: [
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.d.ts',
    '**/types.ts',
    '**/index.ts',
    '**/index.tsx',
    // Presentational components are tested through their parent page/integration.
    'components/**',
    'app/**/components/**',
    // Next.js framework files (no standalone behavior to unit test).
    '**/layout.tsx',
    '**/loading.tsx',
    '**/error.tsx',
    '**/not-found.tsx',
    '**/template.tsx',
    '**/default.tsx',
    '**/global-error.tsx',
    '**/sitemap.ts',
    '**/robots.ts',
    '**/manifest.ts',
    '**/opengraph-image.tsx',
  ],
  testDir: 'tests',
};

function matchesPattern(filePath, patterns) {
  for (const pattern of patterns) {
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*\//g, '<<GLOBSTAR_SEP>>')
      .replace(/\*\*/g, '<<GLOBSTAR>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<GLOBSTAR_SEP>>/g, '(.*/)?')
      .replace(/<<GLOBSTAR>>/g, '.*');
    if (new RegExp(`^${regexStr}$`).test(filePath)) {
      return true;
    }
  }
  return false;
}

/** Recursively collect every test file path under the tests/ tree. */
function collectTestFiles(dir, acc) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      collectTestFiles(full, acc);
    } else if (/\.(test|spec)\.[tj]sx?$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Normalize a test path into a comparable identity, e.g.
 *   tests/unit/app/tasks/test_page.test.tsx -> app/tasks/page
 *   tests/integration/api/test_tasks.test.ts -> api/tasks
 * Strips the tests/{unit,integration}/ prefix, a leading `test_` on the basename,
 * and the `.test`/`.spec` + extension suffix.
 */
function normalizeTestIdentity(testPath) {
  let p = testPath
    .replace(/^tests\/(unit|integration)\//, '')
    .replace(/\.(test|spec)\.[tj]sx?$/, '');
  const base = basename(p);
  if (base.startsWith('test_')) {
    p = p.slice(0, p.length - base.length) + base.replace(/^test_/, '');
  }
  return p;
}

/** Source path -> comparable identity (path minus extension). */
function sourceIdentity(filePath) {
  return filePath.slice(0, filePath.length - extname(filePath).length);
}

/**
 * Check whether a staged source file is covered by a test in the tests/ tree.
 * A source file counts as tested if EITHER its path mirrors a test path
 * (e.g. app/x/page.tsx ↔ tests/unit/app/x/page.test.tsx) OR some test file
 * actually imports it (its module path appears in a test's contents — this
 * catches cross-named tests like login.test.tsx covering signup/page.tsx).
 * @param {string} filePath - Source file path
 * @param {string[]} testIdentities - Normalized identities of existing test files
 * @param {string} testBlob - Concatenated contents of all test files
 * @returns {null | {file: string}}
 */
function checkColocation(filePath, testIdentities, testBlob = '') {
  const id = sourceIdentity(filePath);
  const mirrored = testIdentities.some(
    (t) => t === id || id.endsWith(t) || id.includes(t) || t.includes(id)
  );
  const imported = testBlob.includes(id);
  return mirrored || imported ? null : { file: filePath };
}

function main() {
  let stagedFiles;
  try {
    const output = execFileSync(
      'git',
      ['diff', '--cached', '--name-only', '--diff-filter=ACM'],
      { encoding: 'utf-8' }
    );
    stagedFiles = output.trim().split('\n').filter(Boolean);
  } catch {
    console.error('Failed to get staged files.');
    process.exit(1);
  }

  const sourceFiles = stagedFiles.filter(
    (f) =>
      matchesPattern(f, CONFIG.include) && !matchesPattern(f, CONFIG.exclude)
  );

  if (sourceFiles.length === 0) {
    process.exit(0);
  }

  const testRoot = resolve(CONFIG.testDir);
  const testFiles =
    existsSync(testRoot) && statSync(testRoot).isDirectory()
      ? collectTestFiles(CONFIG.testDir, [])
      : [];
  const testIdentities = testFiles.map(normalizeTestIdentity);
  const testBlob = testFiles
    .map((f) => {
      try {
        return readFileSync(f, 'utf-8');
      } catch {
        return '';
      }
    })
    .join('\n');

  const violations = [];
  for (const f of sourceFiles) {
    const result = checkColocation(f, testIdentities, testBlob);
    if (result) {
      violations.push(result);
    }
  }

  if (violations.length > 0) {
    console.error('\n  BLOCKED: Source modules missing a test in tests/:');
    for (const v of violations) {
      console.error(`    ${v.file}`);
      console.error(
        `      Expected a matching test under tests/unit/ or tests/integration/.`
      );
    }
    console.error(
      '\n  Write tests before committing. TDD: Red → Green → Refactor.\n'
    );
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes('check-test-colocation')) {
  main();
}

module.exports = {
  checkColocation,
  normalizeTestIdentity,
  sourceIdentity,
  matchesPattern,
};
