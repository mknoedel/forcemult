import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PageHero } from '@/app/components/PageHero';

describe('PageHero', () => {
  it('renders the eyebrow, a level-1 title, and the subtitle', () => {
    render(
      <PageHero
        eyebrow="Charts"
        title="Charts Example"
        subtitle="Built with Recharts."
      />
    );

    expect(screen.getByText('Charts')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /charts example/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Built with Recharts.')).toBeInTheDocument();
  });

  it('supports a rich (ReactNode) title and resolves its accessible name', () => {
    render(
      <PageHero
        eyebrow="Design System"
        title={
          <>
            The <span className="italic">living</span> design system.
          </>
        }
      />
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /design system/i })
    ).toBeInTheDocument();
  });

  it('omits the subtitle paragraph when none is provided', () => {
    const { container } = render(<PageHero eyebrow="Tasks" title="Tasks" />);
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });
});
