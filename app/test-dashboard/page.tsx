'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHero } from '../components/PageHero';
import { PageShell } from '../components/PageShell';
import type { TestRunResult } from './types';
import { TestSummaryCard } from './components/TestSummaryCard';
import { CoverageCard } from './components/CoverageCard';
import { TestSuiteList } from './components/TestSuiteList';

export default function TestDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestRunResult | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const response = await fetch('/api/test-runner', {
        method: 'POST',
      });

      const data = await response.json();
      setResults(data);
    } catch {
      setResults({
        success: false,
        summary: null,
        testSuites: [],
        coverage: null,
        error: 'Failed to run tests. Please try again.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Testing"
        title={
          <>
            Test{' '}
            <span className="font-serif font-normal italic text-primary">
              Dashboard
            </span>
          </>
        }
        subtitle="Run your tests and see the results in a friendly format"
      />

      <Card className="border-2 border-foreground rounded-2xl shadow-hard">
        <CardContent className="pt-6">
          <Button
            onClick={runTests}
            disabled={isRunning}
            size="lg"
            className="w-full text-lg h-auto py-4"
          >
            {isRunning ? (
              <>
                <Loader2 className="animate-spin" />
                Running tests... this may take a moment
              </>
            ) : (
              '▶ Run All Tests'
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          {results.summary && <TestSummaryCard summary={results.summary} />}

          {results.coverage && <CoverageCard coverage={results.coverage} />}

          {results.testSuites && results.testSuites.length > 0 && (
            <TestSuiteList testSuites={results.testSuites} />
          )}

          {results.error && (
            <Card className="border-2 border-foreground rounded-2xl shadow-hard">
              <CardContent className="pt-6">
                <div className="rounded-xl border-l-4 border-destructive bg-destructive/10 p-4">
                  <p className="text-destructive font-semibold">
                    Error running tests
                  </p>
                  <p className="text-destructive/80 text-sm mt-2">
                    {results.error}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!results && !isRunning && (
        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-foreground bg-primary text-primary-foreground text-3xl">
              ✓
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Ready to test your code?
            </h2>
            <p className="text-muted-foreground">
              Click the button above to run all your tests and see the results
            </p>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
