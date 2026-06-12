import { Palette, Users, Wrench, Quote } from 'lucide-react';

/**
 * Frames the *problem* before any solution: what an interface looks like with no
 * shared system ("Frankenstein UI"). This sets up why the rest of the page —
 * tokens, components, and enforcement — exists. Written for first-time coders.
 */
export function WhyDesignSystemsSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          Without a design system
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Picture building an app one screen at a time. On the home page you
          pick a nice purple. A week later, on the settings page, you eyeball{' '}
          <em>another</em> purple. The buttons are a little rounder here, a
          little flatter there. Each choice felt fine on its own — but stitched
          together the app looks like it was built by five different people.
          Designers have a name for this:{' '}
          <strong>&ldquo;Frankenstein&rdquo; UI</strong> — a monster assembled
          from mismatched parts.
        </p>
      </div>

      <figure className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-hard">
        <Quote className="h-6 w-6 text-primary" aria-hidden />
        <blockquote className="mt-3 max-w-3xl font-display text-lg italic leading-snug">
          &ldquo;You haven&apos;t truly lived as a UX designer until you&apos;ve
          witnessed a project&apos;s interface turn into a chaotic monster… a
          &lsquo;Frankenstein&rsquo; arises when elements are used arbitrarily,
          and the creature you&apos;ve created grows scarier over time.&rdquo;
        </blockquote>
        <figcaption className="mt-3 text-sm text-muted-foreground">
          — Marie Pierce,{' '}
          <a
            href="https://blog.metrostar.com/design-systems-frankenstein-ux-solutions"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            How Design Systems Prevent Frankenstein UX Solutions
          </a>
        </figcaption>
      </figure>

      <div className="space-y-3">
        <h3 className="font-semibold">Why the patchwork hurts</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Symptom
            icon={<Palette className="h-5 w-5 text-primary" />}
            title="Drift"
            body="Colors and spacings quietly multiply. Soon you have six 'almost the same' purples and no idea which is the real one."
          />
          <Symptom
            icon={<Users className="h-5 w-5 text-primary" />}
            title="Distrust"
            body="Users feel the seams even if they can't name them. Inconsistency reads as careless and chips away at trust in the product."
          />
          <Symptom
            icon={<Wrench className="h-5 w-5 text-primary" />}
            title="Drag"
            body="A simple rebrand becomes a manual hunt for every pasted color. Every change is slow, risky, and easy to get wrong."
          />
        </div>
      </div>

      <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">The cure</strong> is a{' '}
        <strong>design system</strong>: one shared set of choices that every
        screen — and your AI assistant — reuses instead of reinventing. The rest
        of this page is the system this template gives you, and how it keeps the
        monster away automatically.
      </p>
    </section>
  );
}

function Symptom({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-2 rounded-2xl border-2 border-foreground bg-card p-4 shadow-hard">
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-medium">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
