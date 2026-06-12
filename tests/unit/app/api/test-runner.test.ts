/**
 * @jest-environment node
 */
import { POST } from '../../../../app/api/test-runner/route';
import { NextRequest } from 'next/server';
import { execFile } from 'child_process';

jest.mock('child_process');

describe('POST /api/test-runner', () => {
  const mockExecFile = execFile as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns successful test results with coverage', async () => {
    const mockJestOutput = JSON.stringify({
      success: true,
      numTotalTests: 10,
      numPassedTests: 10,
      numFailedTests: 0,
      numPendingTests: 0,
      testResults: [
        {
          name: '/home/user/project/tests/example.test.ts',
          status: 'passed',
          assertionResults: [
            {
              title: 'should pass',
              status: 'passed',
              failureMessages: [],
            },
          ],
          perfStats: { runtime: 100 },
        },
      ],
      coverageMap: {
        '/home/user/project/app/example.ts': {
          s: { '0': 1, '1': 1 },
          b: { '0': [1, 0] },
          f: { '0': 1 },
          statementMap: {
            '0': { start: { line: 1 } },
            '1': { start: { line: 2 } },
          },
        },
      },
    });

    mockExecFile.mockImplementation(
      (_file: string, _args: string[], _opts: any, callback: Function) => {
        callback(null, mockJestOutput, '');
      }
    );

    const request = new NextRequest('http://localhost:3000/api/test-runner');
    const response = (await POST(request)) as Response;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.summary.totalTests).toBe(10);
    expect(data.summary.passedTests).toBe(10);
    expect(data.summary.failedTests).toBe(0);
    expect(data.testSuites).toHaveLength(1);
    expect(data.coverage).toBeDefined();
    expect(parseFloat(data.coverage.statements)).toBeGreaterThan(0);
  });

  it('returns failed test results with error messages', async () => {
    const mockJestOutput = JSON.stringify({
      success: false,
      numTotalTests: 5,
      numPassedTests: 3,
      numFailedTests: 2,
      numPendingTests: 0,
      testResults: [
        {
          name: '/home/user/project/tests/failing.test.ts',
          status: 'failed',
          assertionResults: [
            {
              title: 'should fail',
              status: 'failed',
              failureMessages: [
                'Error: Expected true to be false\n    at Object.<anonymous> (tests/failing.test.ts:10:5)\n    at node_modules/jest/something.js:100:20',
              ],
            },
          ],
          perfStats: { runtime: 50 },
        },
      ],
      coverageMap: {},
    });

    mockExecFile.mockImplementation(
      (_file: string, _args: string[], _opts: any, callback: Function) => {
        callback(null, mockJestOutput, '');
      }
    );

    const request = new NextRequest('http://localhost:3000/api/test-runner');
    const response = (await POST(request)) as Response;
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.summary.failedTests).toBe(2);
    expect(data.testSuites[0].tests[0].failureMessages).toBeDefined();
    expect(data.testSuites[0].tests[0].failureMessages[0]).not.toContain(
      'node_modules'
    );
  });

  it('handles coverage calculation correctly', async () => {
    const mockJestOutput = JSON.stringify({
      success: true,
      numTotalTests: 1,
      numPassedTests: 1,
      numFailedTests: 0,
      numPendingTests: 0,
      testResults: [],
      coverageMap: {
        'file1.ts': {
          s: { '0': 1, '1': 1, '2': 0 },
          b: { '0': [1, 0], '1': [1, 1] },
          f: { '0': 1, '1': 0 },
          statementMap: {
            '0': { start: { line: 1 } },
            '1': { start: { line: 2 } },
            '2': { start: { line: 3 } },
          },
        },
      },
    });

    mockExecFile.mockImplementation(
      (_file: string, _args: string[], _opts: any, callback: Function) => {
        callback(null, mockJestOutput, '');
      }
    );

    const request = new NextRequest('http://localhost:3000/api/test-runner');
    const response = (await POST(request)) as Response;
    const data = await response.json();

    expect(data.coverage).toBeDefined();
    expect(parseFloat(data.coverage.statements)).toBe(66.67);
    expect(parseFloat(data.coverage.functions)).toBe(50.0);
    expect(parseFloat(data.coverage.branches)).toBe(75.0);
  });

  it('handles parse errors gracefully', async () => {
    mockExecFile.mockImplementation(
      (_file: string, _args: string[], _opts: any, callback: Function) => {
        callback(null, 'Invalid JSON output from Jest', '');
      }
    );

    const request = new NextRequest('http://localhost:3000/api/test-runner');
    const response = (await POST(request)) as Response;
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to parse test results. Please try again.');
    expect(data.testSuites).toEqual([]);
  });

  it('extracts JSON from mixed output', async () => {
    const mockJestOutput = `
PASS tests/example.test.ts
Some random text before JSON
${JSON.stringify({
  success: true,
  numTotalTests: 1,
  numPassedTests: 1,
  numFailedTests: 0,
  numPendingTests: 0,
  testResults: [],
  coverageMap: {},
})}
Some text after JSON
    `;

    mockExecFile.mockImplementation(
      (_file: string, _args: string[], _opts: any, callback: Function) => {
        callback(null, mockJestOutput, '');
      }
    );

    const request = new NextRequest('http://localhost:3000/api/test-runner');
    const response = (await POST(request)) as Response;
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.summary.totalTests).toBe(1);
  });

  // Regression: when the route runs from inside `next dev`, the spawned jest
  // inherits NODE_ENV=development. Jest only defaults NODE_ENV to 'test' when it
  // is unset, so the suite would otherwise run in development mode — breaking
  // stream-based tests and surfacing in the UI as false failures. The route must
  // force NODE_ENV=test so the UI run matches the CLI.
  it('runs jest with NODE_ENV=test regardless of the inherited environment', async () => {
    const mockJestOutput = JSON.stringify({
      success: true,
      numTotalTests: 1,
      numPassedTests: 1,
      numFailedTests: 0,
      numPendingTests: 0,
      testResults: [],
      coverageMap: {},
    });

    mockExecFile.mockImplementation(
      (_file: string, _args: string[], _opts: any, callback: Function) => {
        callback(null, mockJestOutput, '');
      }
    );

    const request = new NextRequest('http://localhost:3000/api/test-runner');
    await POST(request);

    const opts = mockExecFile.mock.calls[0][2];
    expect(opts.env).toBeDefined();
    expect(opts.env.NODE_ENV).toBe('test');
  });

  // Regression: `npm test` brackets the Jest JSON with lifecycle banners. The
  // trailing `posttest` banner contains braces (`try{...}catch(e){}`), so a
  // greedy "first `{` … last `}`" match swallows non-JSON text and the parse
  // fails — surfacing in the UI as a false "tests failed" error.
  it('parses Jest JSON wrapped in npm test/posttest banners', async () => {
    const jestJson = JSON.stringify({
      success: true,
      numTotalTests: 3,
      numPassedTests: 3,
      numFailedTests: 0,
      numPendingTests: 0,
      testResults: [],
      coverageMap: {},
    });
    const mockNpmOutput =
      '\n> nextjs-app@1.0.0 test\n> jest --json --coverage --verbose\n\n' +
      jestJson +
      '\n\n> nextjs-app@1.0.0 posttest\n' +
      "> node -e \"try{require('fs').writeFileSync('.test-passed','x')}catch(e){}\"\n\n";

    mockExecFile.mockImplementation(
      (_file: string, _args: string[], _opts: any, callback: Function) => {
        callback(null, mockNpmOutput, '');
      }
    );

    const request = new NextRequest('http://localhost:3000/api/test-runner');
    const response = (await POST(request)) as Response;
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.summary.totalTests).toBe(3);
    expect(data.summary.passedTests).toBe(3);
  });
});
