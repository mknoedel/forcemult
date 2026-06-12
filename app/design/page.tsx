import type { Metadata } from 'next';
import { PageShell } from '../components/PageShell';
import { PageHero } from '../components/PageHero';
import { WhyDesignSystemsSection } from './components/WhyDesignSystemsSection';
import { ConceptsSection } from './components/ConceptsSection';
import { DesignMdSection } from './components/DesignMdSection';
import { ColorTokens } from './components/ColorTokens';
import { TypeAndShapeSection } from './components/TypeAndShapeSection';
import { ComponentGallery } from './components/ComponentGallery';
import { EnforcementSection } from './components/EnforcementSection';
import { AddComponentGuide } from './components/AddComponentGuide';

export const metadata: Metadata = {
  title: 'Design System',
  description:
    'A guided tour of this app’s design system — colors, components, and how consistency is enforced.',
};

export default function DesignPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Design System"
        title={
          <>
            The{' '}
            <span className="font-serif font-normal italic text-primary">
              living
            </span>{' '}
            design system.
          </>
        }
        subtitle="A guided tour of how this app stays good-looking and consistent — what a design system is, the colors and building blocks you have, how new components get added, and how it's all kept on-brand automatically. No experience needed."
      />

      <WhyDesignSystemsSection />
      <ConceptsSection />
      <DesignMdSection />
      <ColorTokens />
      <TypeAndShapeSection />
      <ComponentGallery />
      <EnforcementSection />
      <AddComponentGuide />
    </PageShell>
  );
}
