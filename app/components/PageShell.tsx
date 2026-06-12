import React from 'react';
import Navigation from './Navigation';

/**
 * The standard page frame for every top-level content page (Design, Charts, Chat,
 * Tasks, Test Dashboard). It owns the navigation and the single canonical content
 * frame — width (`max-w-content`), horizontal gutters (`px-6 md:px-9`), vertical
 * padding (`py-12`), and inter-section rhythm (`space-y-10`). Centralizing it here
 * is what keeps every page's layout and padding identical.
 *
 * Pages compose: <PageShell><PageHero … />…content…</PageShell>.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto w-full max-w-content space-y-10 px-6 py-12 md:px-9">
        {children}
      </main>
    </div>
  );
}
