import React from 'react';

/**
 * The shared page header used at the top of every top-level page (Design, Charts,
 * Chat, Tasks, Test Dashboard). One component → one consistent hero: a pill
 * eyebrow, a display-font headline (which may include a serif italic accent), and
 * an optional muted subtitle. Keeping this in one place is what guarantees the
 * pages look like one product.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <header className="space-y-4">
      <span className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-background">
        <span aria-hidden>●</span>
        <span>{eyebrow}</span>
      </span>
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="max-w-3xl text-lg text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  );
}
