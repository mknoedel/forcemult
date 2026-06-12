import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExampleComponent from '../../../../app/components/ExampleComponent';

describe('ExampleComponent', () => {
  it('renders with initial count of 0', () => {
    render(<ExampleComponent />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('increments count when Click Me button is clicked', () => {
    render(<ExampleComponent />);
    const button = screen.getByRole('button', { name: /click me/i });

    fireEvent.click(button);
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays special message when reaching 10 clicks', () => {
    render(<ExampleComponent />);
    const button = screen.getByRole('button', { name: /click me/i });

    for (let i = 0; i < 10; i++) {
      fireEvent.click(button);
    }

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('🎉 You reached 10!')).toBeInTheDocument();
  });

  it('displays special message when reaching 20 clicks', () => {
    render(<ExampleComponent />);
    const button = screen.getByRole('button', { name: /click me/i });

    for (let i = 0; i < 20; i++) {
      fireEvent.click(button);
    }

    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('🚀 Amazing! 20 clicks!')).toBeInTheDocument();
  });

  it('hides message when continuing past 10 clicks', () => {
    render(<ExampleComponent />);
    const button = screen.getByRole('button', { name: /click me/i });

    for (let i = 0; i < 10; i++) {
      fireEvent.click(button);
    }

    expect(screen.getByText('🎉 You reached 10!')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText('🎉 You reached 10!')).not.toBeInTheDocument();
  });

  it('resets count and message when Reset button is clicked', () => {
    render(<ExampleComponent />);
    const incrementButton = screen.getByRole('button', { name: /click me/i });
    const resetButton = screen.getByRole('button', { name: /reset/i });

    for (let i = 0; i < 10; i++) {
      fireEvent.click(incrementButton);
    }

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('🎉 You reached 10!')).toBeInTheDocument();

    fireEvent.click(resetButton);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('🎉 You reached 10!')).not.toBeInTheDocument();
  });

  it('renders educational note with component file path', () => {
    render(<ExampleComponent />);
    expect(screen.getByText(/student note/i)).toBeInTheDocument();
    expect(screen.getByText(/ExampleComponent.tsx/)).toBeInTheDocument();
  });
});
