import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';

function sanitizeFailureMessage(msg: string): string {
  const lines = msg.split('\n');
  const relevantLines = lines
    .filter(
      (line) =>
        !line.includes('at Object.') &&
        !line.includes('at async') &&
        !line.includes('node_modules') &&
        line.trim().length > 0
    )
    .slice(0, 3);
  return relevantLines.join('\n');
}

// Extract the first complete, brace-balanced JSON object from `text`.
// Jest's `--json` report is a single object, but stdout may be bracketed by
// noise (npm lifecycle banners, posttest output) — some of which contains
// braces. A greedy "first `{` … last `}`" match would swallow that trailing
// noise and fail to parse, so we scan for the matching closing brace instead,
// ignoring braces inside string literals.
function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return text.slice(start, i + 1);
  }

  return null;
}

function parseTestResults(stdout: string) {
  try {
    return JSON.parse(stdout);
  } catch {
    const json = extractJsonObject(stdout);
    if (json) return JSON.parse(json);
    throw new Error('Failed to parse Jest output');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return new Promise((resolve) => {
    // Run Jest's CLI directly via `npx` (not `npm test`) with execFile and an
    // argument array — no shell, so no command-injection surface. Going through
    // npm would print lifecycle banners and run the `posttest` hook, which both
    // pollute stdout AND write `.test-passed` for the current commit, letting a
    // UI click make the pre-push hook skip tests. `npx` runs the locally
    // installed jest binary and triggers no npm lifecycle scripts.
    //
    // We invoke jest by command name (`npx jest`) rather than `node
    // node_modules/jest/bin/jest.js`: the bundler's static analyzer treats a
    // path-like string argument (one containing slashes) as a module to resolve
    // at build time and fails the build, but a bare command name is opaque to
    // it. `--no-install` keeps it offline — jest is already a dev dependency.
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    execFile(
      npx,
      ['--no-install', 'jest', '--json', '--coverage', '--verbose'],
      {
        maxBuffer: 1024 * 1024 * 10,
        cwd: process.cwd(),
        // When this route runs from inside `next dev`, the spawned jest inherits
        // NODE_ENV=development. Jest only defaults NODE_ENV to 'test' when it is
        // unset, so without this override the suite runs in development mode —
        // breaking stream-based tests and surfacing in the UI as false failures.
        // Force 'test' so the UI run matches the CLI (`npm test`).
        env: { ...process.env, NODE_ENV: 'test' },
      },
      (error, stdout, stderr) => {
        try {
          const testResults = parseTestResults(stdout);

          const summary = testResults.numTotalTests
            ? {
                totalTests: testResults.numTotalTests,
                passedTests: testResults.numPassedTests,
                failedTests: testResults.numFailedTests,
                pendingTests: testResults.numPendingTests,
                success: testResults.success,
              }
            : null;

          const testSuites =
            testResults.testResults?.map((suite: any) => ({
              name: suite.name.replace(process.cwd(), ''),
              status: suite.status,
              tests: suite.assertionResults?.map((test: any) => ({
                title: test.title,
                status: test.status,
                failureMessages: test.failureMessages?.map(
                  sanitizeFailureMessage
                ),
              })),
              duration: suite.perfStats?.runtime || 0,
            })) || [];

          let coverage = null;
          if (testResults.coverageMap) {
            const coverageMap = testResults.coverageMap;
            const files = Object.keys(coverageMap);

            let totalStatements = 0;
            let coveredStatements = 0;
            let totalBranches = 0;
            let coveredBranches = 0;
            let totalFunctions = 0;
            let coveredFunctions = 0;
            let totalLines = 0;
            let coveredLines = 0;

            files.forEach((file) => {
              const fileCoverage = coverageMap[file];
              if (fileCoverage.s) {
                totalStatements += Object.keys(fileCoverage.s).length;
                coveredStatements += Object.values(fileCoverage.s).filter(
                  (v: any) => v > 0
                ).length;
              }
              if (fileCoverage.b) {
                const branches = Object.values(fileCoverage.b);
                branches.forEach((branch: any) => {
                  if (Array.isArray(branch)) {
                    totalBranches += branch.length;
                    coveredBranches += branch.filter(
                      (v: number) => v > 0
                    ).length;
                  }
                });
              }
              if (fileCoverage.f) {
                totalFunctions += Object.keys(fileCoverage.f).length;
                coveredFunctions += Object.values(fileCoverage.f).filter(
                  (v: any) => v > 0
                ).length;
              }
              if (fileCoverage.statementMap) {
                const lines = Object.values(fileCoverage.statementMap).map(
                  (stmt: any) => stmt.start.line
                );
                const uniqueLines = new Set(lines);
                totalLines += uniqueLines.size;

                const executedStatements = Object.keys(fileCoverage.s).filter(
                  (key) => (fileCoverage.s as any)[key] > 0
                );
                const coveredUniqueLines = new Set(
                  executedStatements.map(
                    (key) => (fileCoverage.statementMap as any)[key].start.line
                  )
                );
                coveredLines += coveredUniqueLines.size;
              }
            });

            coverage = {
              lines:
                totalLines > 0
                  ? ((coveredLines / totalLines) * 100).toFixed(2)
                  : '0',
              statements:
                totalStatements > 0
                  ? ((coveredStatements / totalStatements) * 100).toFixed(2)
                  : '0',
              functions:
                totalFunctions > 0
                  ? ((coveredFunctions / totalFunctions) * 100).toFixed(2)
                  : '0',
              branches:
                totalBranches > 0
                  ? ((coveredBranches / totalBranches) * 100).toFixed(2)
                  : '0',
            };
          }

          resolve(
            NextResponse.json({
              success: true,
              summary,
              testSuites,
              coverage,
            })
          );
        } catch (parseError: any) {
          resolve(
            NextResponse.json(
              {
                success: false,
                error: 'Failed to parse test results. Please try again.',
                summary: null,
                testSuites: [],
              },
              { status: 200 }
            )
          );
        }
      }
    );
  });
}
