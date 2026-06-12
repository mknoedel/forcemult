import type { Metadata } from 'next';
import { PageShell } from '../components/PageShell';
import { PageHero } from '../components/PageHero';
import { WhatIsMemorySection } from './components/WhatIsMemorySection';
import { KnowledgeGraphSection } from './components/KnowledgeGraphSection';
import { HowWeUseZepSection } from './components/HowWeUseZepSection';
import { UserSummaryCard } from './components/UserSummaryCard';
import { GraphSearchExplorer } from './components/GraphSearchExplorer';

export const metadata: Metadata = {
  title: 'Memory & Knowledge Graphs',
  description:
    'Learn how this app gives its AI long-term memory with Zep and knowledge graphs — then explore your own memory and search your graph.',
};

export default function MemoryPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Long-term Memory"
        title={
          <>
            How AI{' '}
            <span className="font-serif font-normal italic text-primary">
              remembers
            </span>{' '}
            you.
          </>
        }
        subtitle="A plain-language guide to long-term memory, knowledge graphs, and how this app uses Zep to remember you across conversations — plus two live tools to explore your own memory. No engineering background needed."
      />

      <WhatIsMemorySection />
      <KnowledgeGraphSection />
      <HowWeUseZepSection />

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold">Try it yourself</h2>
          <p className="max-w-3xl text-muted-foreground">
            These tools talk to your own Zep graph through a server route — your
            API key never touches the browser, and you can only ever see your
            own memory. Chat a few times first so there&apos;s something to
            find.
          </p>
        </div>
        <UserSummaryCard />
        <GraphSearchExplorer />
      </section>
    </PageShell>
  );
}
