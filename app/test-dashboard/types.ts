export interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  failureMessages?: string[];
}

export interface TestSuite {
  name: string;
  status: string;
  tests: TestResult[];
  duration: number;
}

export interface Coverage {
  lines: string;
  statements: string;
  functions: string;
  branches: string;
}

export interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  pendingTests: number;
  success: boolean;
}

export interface TestRunResult {
  success: boolean;
  summary: TestSummary | null;
  testSuites: TestSuite[];
  coverage: Coverage | null;
  error?: string;
}
