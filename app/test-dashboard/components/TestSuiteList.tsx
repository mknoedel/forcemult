'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TestSuite } from '../types';

export function TestSuiteList({ testSuites }: { testSuites: TestSuite[] }) {
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  const toggleSuite = (suiteName: string) => {
    const newExpanded = new Set(expandedSuites);
    if (newExpanded.has(suiteName)) {
      newExpanded.delete(suiteName);
    } else {
      newExpanded.add(suiteName);
    }
    setExpandedSuites(newExpanded);
  };

  return (
    <Card className="border-2 border-foreground rounded-2xl shadow-hard">
      <CardHeader>
        <CardTitle className="font-display">Test Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {testSuites.map((suite, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border-2 border-foreground"
            >
              <Button
                variant="ghost"
                onClick={() => toggleSuite(suite.name)}
                className="w-full h-auto px-4 py-3 bg-muted/50 hover:bg-muted flex items-center justify-between rounded-none"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-muted-foreground">
                    {expandedSuites.has(suite.name) ? '▼' : '▶'}
                  </span>
                  <span className="font-medium text-left">{suite.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={
                      suite.status === 'passed'
                        ? 'bg-teal/15 text-teal border-2 border-teal/40'
                        : 'bg-destructive/15 text-destructive border-2 border-destructive/40'
                    }
                  >
                    {suite.status === 'passed' ? '✓ Passed' : '✗ Failed'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {suite.duration}ms
                  </span>
                </div>
              </Button>

              {expandedSuites.has(suite.name) && (
                <div className="p-4 bg-card border-t">
                  <div className="space-y-2">
                    {suite.tests.map((test, testIdx) => (
                      <div key={testIdx} className="pl-4 py-2 border-l-2">
                        <div className="flex items-start space-x-2">
                          <span
                            className={`mt-1 ${
                              test.status === 'passed'
                                ? 'text-teal'
                                : test.status === 'failed'
                                  ? 'text-destructive'
                                  : 'text-gold'
                            }`}
                          >
                            {test.status === 'passed'
                              ? '✓'
                              : test.status === 'failed'
                                ? '✗'
                                : '⏭'}
                          </span>
                          <div className="flex-1">
                            <p className="text-foreground">{test.title}</p>
                            {test.failureMessages &&
                              test.failureMessages.length > 0 && (
                                <div className="mt-2 rounded-lg border-2 border-destructive/40 bg-destructive/10 p-3 text-sm">
                                  <p className="font-semibold text-destructive mb-1">
                                    Error:
                                  </p>
                                  {test.failureMessages.map((msg, msgIdx) => (
                                    <pre
                                      key={msgIdx}
                                      className="text-destructive/80 whitespace-pre-wrap font-mono text-xs"
                                    >
                                      {msg}
                                    </pre>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
