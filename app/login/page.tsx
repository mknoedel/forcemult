import Link from 'next/link';
import { login } from './actions';
import OAuthButtons from '../components/OAuthButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-md border-2 border-foreground rounded-2xl shadow-hard">
        <CardHeader className="space-y-3">
          <span className="relative block h-8 w-8" aria-hidden="true">
            <span className="absolute left-0 h-8 w-4 rounded-l-full bg-primary" />
            <span className="absolute right-0 top-0 h-4 w-4 bg-coral" />
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-br-full bg-gold" />
          </span>
          <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
            Sign in
          </CardTitle>
          <CardDescription>Welcome back. Sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-xl border-2 border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <OAuthButtons />

          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
