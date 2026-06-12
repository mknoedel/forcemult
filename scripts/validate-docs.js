#!/usr/bin/env node

/**
 * CLAUDE.md drift detection script.
 *
 * Two modes:
 * 1. Pre-commit (default): Warn if source files changed but CLAUDE.md didn't.
 * 2. Standalone (--full): Verify required sections exist and AUTO markers are present.
 *
 * Usage:
 *   node scripts/validate-docs.js          # Pre-commit mode (staged files)
 *   node scripts/validate-docs.js --full   # Full check
 */

const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve, basename } = require('node:path');

const CONFIG = {
  docFile: 'CLAUDE.md',
  trackedDirs: ['app/', 'components/', 'lib/', 'types/', 'scripts/'],
  requiredSections: ['Directory Structure', 'Key Modules'],
  requiredMarkers: ['tree', 'modules'],
};

/**
 * Extract a markdown section by its heading. Returns content between the heading
 * and the next heading at the same or higher level.
 * @param {string} markdown - Full markdown content
 * @param {string} heading - Section heading text
 * @returns {string} Section content (empty string if not found)
 */
function extractSection(markdown, heading) {
  const lines = markdown.split('\n');
  let inSection = false;
  let sectionLevel = 0;
  const result = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (text === heading) {
        inSection = true;
        sectionLevel = level;
        continue;
      } else if (inSection && level <= sectionLevel) {
        break;
      }
    }
    if (inSection) {
      result.push(line);
    }
  }

  return result.join('\n').trim();
}

/**
 * Check if staged files include tracked directories but not CLAUDE.md.
 * @param {string[]} stagedFiles - List of staged file paths
 * @returns {{warn: boolean, changedFiles: string[]}}
 */
function checkStagedFilesDrift(stagedFiles) {
  const claudeMdStaged = stagedFiles.some((f) => basename(f) === 'CLAUDE.md');
  const trackedChanges = stagedFiles.filter((f) =>
    CONFIG.trackedDirs.some((dir) => f.startsWith(dir))
  );

  if (trackedChanges.length > 0 && !claudeMdStaged) {
    return { warn: true, changedFiles: trackedChanges };
  }
  return { warn: false, changedFiles: [] };
}

/** Full check: required sections and AUTO markers are present. */
function runFullAnalysis() {
  const docPath = resolve(CONFIG.docFile);
  let markdown;
  try {
    markdown = readFileSync(docPath, 'utf-8');
  } catch {
    console.error(`Cannot read ${CONFIG.docFile}`);
    process.exit(1);
  }

  let hasIssues = false;

  for (const section of CONFIG.requiredSections) {
    if (!extractSection(markdown, section)) {
      hasIssues = true;
      console.warn(`  Missing required section: "${section}"`);
    }
  }

  for (const marker of CONFIG.requiredMarkers) {
    if (
      !markdown.includes(`<!-- AUTO:${marker} -->`) ||
      !markdown.includes(`<!-- /AUTO:${marker} -->`)
    ) {
      hasIssues = true;
      console.warn(`  Missing AUTO marker: "${marker}"`);
    }
  }

  if (hasIssues) {
    console.warn('\n  Update CLAUDE.md to restore required structure.\n');
    process.exit(1);
  }
  console.log('  CLAUDE.md structure is valid.');
}

/** Pre-commit mode: warn (non-blocking) if docs may need updating. */
function runPreCommitCheck() {
  let stagedFiles;
  try {
    const output = execFileSync(
      'git',
      ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
      { encoding: 'utf-8' }
    );
    stagedFiles = output.trim().split('\n').filter(Boolean);
  } catch {
    process.exit(0);
  }

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  const result = checkStagedFilesDrift(stagedFiles);

  if (result.warn) {
    console.warn(
      '\n  Warning: CLAUDE.md may need updating. Changed files in tracked dirs:'
    );
    for (const f of result.changedFiles) {
      console.warn(`    ${f}`);
    }
    console.warn(
      '  Run `node scripts/validate-docs.js --full` to check structure.\n'
    );
  }
}

function main() {
  if (process.argv.includes('--full')) {
    runFullAnalysis();
  } else {
    runPreCommitCheck();
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractSection, checkStagedFilesDrift };
