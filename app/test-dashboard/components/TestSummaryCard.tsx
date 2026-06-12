import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TestSummary } from '../types';

export function TestSummaryCard({ summary }: { summary: TestSummary }) {
  return (
    <Card className="border-2 border-foreground rounded-2xl shadow-hard">
      <CardHeader>
        <CardTitle className="font-display">Test Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl border-2 border-foreground bg-muted/50">
            <div className="text-3xl font-bold text-foreground">
              {summary.totalTests}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Total Tests
            </div>
          </div>
          <div className="text-center p-4 rounded-xl border-2 border-foreground bg-teal/10">
            <div className="text-3xl font-bold text-teal">
              ✓ {summary.passedTests}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Passing</div>
          </div>
          <div className="text-center p-4 rounded-xl border-2 border-foreground bg-destructive/10">
            <div className="text-3xl font-bold text-destructive">
              ✗ {summary.failedTests}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Failing</div>
          </div>
          <div className="text-center p-4 rounded-xl border-2 border-foreground bg-gold/10">
            <div className="text-3xl font-bold text-gold">
              ⏭ {summary.pendingTests}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Skipped</div>
          </div>
        </div>

        {summary.success ? (
          <div className="mt-6 p-4 rounded-xl border-l-4 border-teal bg-teal/10">
            <p className="text-teal font-semibold">
              🎉 All tests passed! Great work!
            </p>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-xl border-l-4 border-destructive bg-destructive/10">
            <p className="text-destructive font-semibold">
              {summary.failedTests}{' '}
              {summary.failedTests === 1 ? 'test needs' : 'tests need'}{' '}
              attention
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
