/**
 * Typography scale and shape (corner radius) reference. Shows the three real
 * typefaces — Bricolage Grotesque (display), Hanken Grotesk (body), and
 * Instrument Serif (italic accent) — and the rounding tokens used across the app.
 */
const TYPE_SAMPLES = [
  {
    label: 'Display',
    sample: 'Build something worth shipping',
    className: 'font-display text-3xl font-extrabold tracking-tight',
    note: 'font-display — Bricolage Grotesque',
  },
  {
    label: 'Heading',
    sample: 'What’s in the box',
    className: 'font-display text-2xl font-bold tracking-tight',
    note: 'font-display — Bricolage Grotesque',
  },
  {
    label: 'Serif accent',
    sample: 'worth',
    className: 'font-serif text-3xl italic text-primary',
    note: 'font-serif — Instrument Serif',
  },
  {
    label: 'Body',
    sample: 'The quick brown fox jumps over the lazy dog.',
    className: 'text-base',
    note: 'font-sans — Hanken Grotesk',
  },
  {
    label: 'Label',
    sample: 'Form label',
    className: 'text-sm font-medium',
    note: 'font-sans — Hanken Grotesk',
  },
  {
    label: 'Small',
    sample: 'Caption / metadata',
    className: 'text-xs text-muted-foreground',
    note: 'font-sans — Hanken Grotesk',
  },
];

const RADII = [
  { name: 'rounded-sm', className: 'rounded-sm' },
  { name: 'rounded-md', className: 'rounded-md' },
  { name: 'rounded-lg', className: 'rounded-lg' },
  { name: 'rounded-2xl', className: 'rounded-2xl' },
];

export function TypeAndShapeSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          Typography &amp; shape
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Three typefaces work together: <strong>Bricolage Grotesque</strong>{' '}
          for display headings (
          <code className="rounded bg-muted px-1 text-foreground">
            font-display
          </code>
          ), <strong>Hanken Grotesk</strong> for body and UI (the default sans),
          and <strong>Instrument Serif</strong> for the occasional italic accent
          (
          <code className="rounded bg-muted px-1 text-foreground">
            font-serif
          </code>
          ). Reusing these keeps text uniform everywhere.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border-2 border-foreground bg-card p-5 shadow-hard">
          <p className="text-sm font-medium text-muted-foreground">
            Type scale
          </p>
          {TYPE_SAMPLES.map((sample) => (
            <div
              key={sample.label}
              className="flex items-baseline justify-between gap-4 border-b pb-3 last:border-0"
            >
              <span className={sample.className}>{sample.sample}</span>
              <code className="shrink-0 text-xs text-muted-foreground">
                {sample.note}
              </code>
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-2xl border-2 border-foreground bg-card p-5 shadow-hard">
          <p className="text-sm font-medium text-muted-foreground">
            Corner radius
          </p>
          <div className="flex flex-wrap gap-5">
            {RADII.map((radius) => (
              <div key={radius.name} className="text-center">
                <div
                  className={`h-20 w-20 border-2 border-primary bg-primary/10 ${radius.className}`}
                />
                <code className="mt-2 block text-xs text-muted-foreground">
                  {radius.name}
                </code>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Radii derive from a single{' '}
            <code className="text-foreground">--radius</code> value in
            globals.css; cards use{' '}
            <code className="text-foreground">rounded-2xl</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
