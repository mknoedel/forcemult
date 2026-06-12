import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Coverage } from '../types';

function getCoverageColor(percentage: string) {
  const pct = parseFloat(percentage);
  if (pct >= 80) return 'text-teal';
  if (pct >= 60) return 'text-gold';
  return 'text-destructive';
}

function getCoverageBarColor(percentage: string) {
  const pct = parseFloat(percentage);
  if (pct >= 80) return 'bg-teal';
  if (pct >= 60) return 'bg-gold';
  return 'bg-destructive';
}

export function CoverageCard({ coverage }: { coverage: Coverage }) {
  return (
    <Card className="border-2 border-foreground rounded-2xl shadow-hard">
      <CardHeader>
        <CardTitle className="font-display">Code Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">
          Coverage shows how much of your code is being tested. Higher
          percentages are better!
        </p>

        <div className="space-y-4">
          {(
            [
              [
                'Lines',
                coverage.lines,
                'This shows what percentage of code lines were executed during testing',
              ],
              [
                'Statements',
                coverage.statements,
                'This measures individual statements that were run during tests',
              ],
              [
                'Functions',
                coverage.functions,
                'This shows what percentage of your functions were called during testing',
              ],
              [
                'Branches',
                coverage.branches,
                'This measures different paths through your code (if/else statements, etc.)',
              ],
            ] as const
          ).map(([label, value, explanation]) => (
            <div key={label}>
              <div className="flex justify-between mb-2">
                <span className="font-medium">{label}</span>
                <span className={`font-bold ${getCoverageColor(value)}`}>
                  {value}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getCoverageBarColor(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {explanation}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border-2 border-foreground bg-primary/5 p-4">
          <h3 className="font-display font-semibold text-foreground mb-2">
            What does coverage mean?
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • <strong>Teal (80%+)</strong> - Excellent! Your code is well
              tested
            </li>
            <li>
              • <strong>Gold (60-79%)</strong> - Good, but there&apos;s room for
              improvement
            </li>
            <li>
              • <strong>Coral/red (&lt;60%)</strong> - More tests needed to
              ensure code quality
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
