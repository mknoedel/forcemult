'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The living color palette. Each swatch renders with its real token class
 * (e.g. `bg-primary`) so students see the actual color, plus the Tailwind class
 * and CSS variable they'd use. The displayed value is read *live* from the
 * rendered swatch (getComputedStyle), so it can never drift from the theme and
 * it follows the dark-mode toggle. Edit the values in app/globals.css and both
 * the swatch and the value here update automatically.
 */
type ColorToken = {
  name: string;
  swatch: string; // real Tailwind background class (also shown as the label)
  text: string; // foreground class for readable text on the swatch
  cssVar: string;
  use: string;
};

const SURFACE_TOKENS: ColorToken[] = [
  {
    name: 'primary',
    swatch: 'bg-primary',
    text: 'text-primary-foreground',
    cssVar: '--primary',
    use: 'Main brand & actions',
  },
  {
    name: 'secondary',
    swatch: 'bg-secondary',
    text: 'text-secondary-foreground',
    cssVar: '--secondary',
    use: 'Low-emphasis surfaces',
  },
  {
    name: 'muted',
    swatch: 'bg-muted',
    text: 'text-muted-foreground',
    cssVar: '--muted',
    use: 'Subtle backgrounds',
  },
  {
    name: 'accent',
    swatch: 'bg-accent',
    text: 'text-accent-foreground',
    cssVar: '--accent',
    use: 'Hover & highlight',
  },
  {
    name: 'destructive',
    swatch: 'bg-destructive',
    text: 'text-destructive-foreground',
    cssVar: '--destructive',
    use: 'Errors & delete',
  },
  {
    name: 'gold',
    swatch: 'bg-gold',
    text: 'text-gold-foreground',
    cssVar: '--gold',
    use: 'Accent — warnings & highlights',
  },
  {
    name: 'coral',
    swatch: 'bg-coral',
    text: 'text-coral-foreground',
    cssVar: '--coral',
    use: 'Accent — high priority',
  },
  {
    name: 'teal',
    swatch: 'bg-teal',
    text: 'text-teal-foreground',
    cssVar: '--teal',
    use: 'Accent — success & low priority',
  },
  {
    name: 'card',
    swatch: 'bg-card',
    text: 'text-card-foreground',
    cssVar: '--card',
    use: 'Card surfaces',
  },
];

const CHART_SWATCHES = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
];

export function ColorTokens() {
  const [values, setValues] = useState<Record<string, string>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  // Read the real, resolved background-color off each rendered swatch. Reading
  // the element (not the CSS var) means the value is already resolved to rgb and
  // automatically reflects the active light/dark theme.
  function readValues() {
    const root = gridRef.current;
    if (!root) return;
    const next: Record<string, string> = {};
    root.querySelectorAll<HTMLElement>('[data-token]').forEach((el) => {
      const key = el.dataset.token;
      if (key) next[key] = getComputedStyle(el).backgroundColor;
    });
    setValues(next);
  }

  useEffect(() => {
    readValues();
    // Re-read when the theme toggles (the .dark class flips on <html>).
    const observer = new MutationObserver(readValues);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">Your color tokens</h2>
        <p className="max-w-3xl text-muted-foreground">
          These are your app&apos;s colors. Use the <em>name</em> (the Tailwind
          class), never a raw color code — that&apos;s what keeps the whole app
          consistent. Every color also has a matching{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">
            -foreground
          </code>{' '}
          color for readable text on top of it. The value under each swatch is{' '}
          <strong>read live from your rendered theme</strong> — change{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">
            app/globals.css
          </code>{' '}
          (or flip dark mode) and it updates here too.
        </p>
      </div>

      <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SURFACE_TOKENS.map((token) => (
          <div
            key={token.name}
            className="overflow-hidden rounded-2xl border-2 border-foreground bg-card shadow-hard"
          >
            <div
              data-token={token.name}
              className={`flex h-20 items-end p-3 ${token.swatch} ${token.text}`}
            >
              <span className="text-sm font-semibold capitalize">
                {token.name}
              </span>
            </div>
            <div className="space-y-1 p-3 text-xs">
              <p className="text-muted-foreground">{token.use}</p>
              <p className="flex flex-wrap gap-x-3">
                <code className="text-foreground">{token.swatch}</code>
                <code className="text-muted-foreground">{token.cssVar}</code>
              </p>
              {values[token.name] && (
                <p className="text-muted-foreground">
                  <span className="text-muted-foreground/70">live: </span>
                  <code className="text-foreground">{values[token.name]}</code>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-foreground bg-card p-5 shadow-hard">
        <p className="mb-3 text-sm font-medium">
          Chart palette{' '}
          <span className="font-normal text-muted-foreground">
            — for data visualization (see the Charts page)
          </span>
        </p>
        <div className="flex flex-wrap gap-3">
          {CHART_SWATCHES.map((swatch, i) => (
            <div key={swatch} className="text-center">
              <div
                data-token={`chart-${i + 1}`}
                className={`h-10 w-16 rounded-md ${swatch}`}
              />
              <code className="text-xs text-muted-foreground">
                chart-{i + 1}
              </code>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Also available as tokens:{' '}
        <code className="text-foreground">background</code>,{' '}
        <code className="text-foreground">foreground</code>,{' '}
        <code className="text-foreground">border</code>,{' '}
        <code className="text-foreground">input</code>, and{' '}
        <code className="text-foreground">ring</code>.
      </p>
    </section>
  );
}
