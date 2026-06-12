'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ExampleComponent() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  const handleIncrement = () => {
    setCount(count + 1);
    if (count + 1 === 10) {
      setMessage('🎉 You reached 10!');
    } else if (count + 1 === 20) {
      setMessage('🚀 Amazing! 20 clicks!');
    } else {
      setMessage('');
    }
  };

  const handleReset = () => {
    setCount(0);
    setMessage('');
  };

  return (
    <Card className="rounded-2xl border-2 border-foreground bg-primary/5">
      <CardContent className="pt-6 text-center">
        <p className="text-muted-foreground mb-4">
          This is an example interactive component. Click the button to see it
          in action!
        </p>

        {/* Counter Display */}
        <div className="mb-6">
          <p className="text-4xl font-bold text-primary mb-2">{count}</p>
          {message && (
            <p className="text-lg text-teal font-semibold animate-pulse">
              {message}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <Button onClick={handleIncrement}>Click Me!</Button>
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>

        {/* Educational Note */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>💡 Student Note:</strong> This component uses React hooks
              (useState), shadcn/ui components, and Tailwind CSS for styling.
              Check out{' '}
              <code className="bg-muted px-1 rounded text-primary">
                app/components/ExampleComponent.tsx
              </code>{' '}
              to see the code!
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
