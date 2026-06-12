import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StudentsInfoCard() {
  return (
    <Card className="border-2 border-foreground rounded-2xl shadow-hard">
      <CardHeader>
        <CardTitle className="font-display text-xl">For Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground mb-4">
            This example demonstrates:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>
              <strong>Environment Variables:</strong> Supabase credentials
              stored in environment variables (e.g. a{' '}
              <code className="bg-muted px-2 py-1 rounded">.env.local</code>{' '}
              file)
            </li>
            <li>
              <strong>API Routes:</strong> RESTful endpoints in{' '}
              <code className="bg-muted px-2 py-1 rounded">app/api/tasks/</code>
            </li>
            <li>
              <strong>CRUD Operations:</strong> Create, Read, Update, Delete
              tasks
            </li>
            <li>
              <strong>Type Safety:</strong> TypeScript types for database schema
            </li>
            <li>
              <strong>Error Handling:</strong> Proper error messages and loading
              states
            </li>
            <li>
              <strong>Client-Side State:</strong> React hooks for managing UI
              state
            </li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Study the code in{' '}
            <code className="bg-muted px-2 py-1 rounded">app/tasks/</code>,
            <code className="bg-muted px-2 py-1 rounded">app/api/tasks/</code>,
            and
            <code className="bg-muted px-2 py-1 rounded">
              lib/supabase.ts
            </code>{' '}
            to understand how it works!
          </p>
          <p className="text-muted-foreground mt-4">
            See{' '}
            <code className="bg-muted px-2 py-1 rounded">
              SUPABASE_SETUP.md
            </code>{' '}
            for the full setup guide.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
