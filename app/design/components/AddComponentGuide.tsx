import {
  Search,
  Eye,
  Download,
  FolderCheck,
  Sparkles,
  ArrowRight,
  ArrowDown,
  Bot,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * A taste of the wider shadcn registry — components that aren't installed yet
 * but are one `add` command away. Not exhaustive; the full catalog lives at
 * ui.shadcn.com/docs/components.
 */
const CATALOG = [
  'Dialog',
  'Table',
  'Tabs',
  'Accordion',
  'Tooltip',
  'Dropdown Menu',
  'Sheet',
  'Popover',
  'Sonner (toast)',
  'Skeleton',
  'Avatar',
  'Switch',
];

/**
 * A friendly, visual walkthrough of how a new component enters the project via
 * the shadcn CLI. Built as a step "pipeline" graphic so non-technical students
 * can follow it at a glance. Commands are shown as plain text to copy.
 */
type Step = {
  icon: React.ReactNode;
  title: string;
  blurb: string;
  code: string;
  isResult?: boolean;
};

const STEPS: Step[] = [
  {
    icon: <Search className="h-6 w-6" />,
    title: '1. Find it',
    blurb: 'Search the shadcn catalog for what you need.',
    code: 'npx shadcn@latest search @shadcn -q dialog',
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: '2. Preview it',
    blurb: 'Peek at the component before adding it.',
    code: 'npx shadcn@latest view @shadcn/dialog',
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: '3. Add it',
    blurb: 'Install it into your project (always pass --yes).',
    code: 'npx shadcn@latest add dialog --yes',
  },
  {
    icon: <FolderCheck className="h-6 w-6" />,
    title: '4. It appears',
    blurb: 'A ready-made file lands in your project.',
    code: 'components/ui/dialog.tsx',
    isResult: true,
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: '5. Use it',
    blurb: 'Drop it into a page — already matching your colors.',
    code: '<Dialog />',
    isResult: true,
  },
];

export function AddComponentGuide() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          Adding a new component
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Need something we don&apos;t have yet — a dialog, a table, tabs? You
          don&apos;t build it from scratch. You ask <strong>shadcn</strong> to
          add it, and a polished, on-brand component drops straight into your
          project. Here&apos;s the whole journey:
        </p>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
        {STEPS.map((step, i) => (
          <div key={step.title} className="contents">
            <StepCard step={step} />
            {i < STEPS.length - 1 && <Connector />}
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border-2 border-foreground bg-card p-5 shadow-hard">
        <div>
          <h3 className="font-semibold">What else you can add</h3>
          <p className="text-sm text-muted-foreground">
            The four components in your gallery are just the start. These are a
            few of the most useful ones you can pull in with the steps above —
            each lands in{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              components/ui/
            </code>{' '}
            already matching your colors.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATALOG.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Not sure what exists? Search the catalog from the terminal —{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">
            npx shadcn@latest search @shadcn -q table
          </code>{' '}
          — or{' '}
          <a
            href="https://ui.shadcn.com/docs/components"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
          >
            browse all components
          </a>{' '}
          on the shadcn site.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <Bot className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">
            Don&apos;t want to type commands?
          </strong>{' '}
          Just tell your AI assistant what you need — e.g.{' '}
          <em>&ldquo;add a dialog component&rdquo;</em> — and it runs these
          steps for you, then wires the component into your page.
        </p>
      </div>
    </section>
  );
}

function StepCard({ step }: { step: Step }) {
  return (
    <div className="min-w-0 flex-1 space-y-2 rounded-2xl border-2 border-foreground bg-card p-4 shadow-hard">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-md ${
          step.isResult
            ? 'bg-primary/10 text-primary'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        {step.icon}
      </div>
      <p className="font-semibold">{step.title}</p>
      <p className="text-sm text-muted-foreground">{step.blurb}</p>
      <code className="block overflow-x-auto whitespace-nowrap rounded bg-muted p-2 text-xs text-foreground">
        {step.code}
      </code>
    </div>
  );
}

function Connector() {
  return (
    <div
      aria-hidden
      className="flex items-center justify-center text-muted-foreground"
    >
      <ArrowDown className="h-5 w-5 md:hidden" />
      <ArrowRight className="hidden h-5 w-5 md:block" />
    </div>
  );
}
