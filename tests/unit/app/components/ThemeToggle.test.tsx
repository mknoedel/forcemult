import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeToggle } from '@/app/components/ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders an accessible toggle button', () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole('button', { name: /dark mode|theme/i })
    ).toBeInTheDocument();
  });

  it('adds the "dark" class to <html> when toggled on', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /dark mode|theme/i });

    act(() => button.click());

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the "dark" class when toggled twice', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /dark mode|theme/i });

    act(() => button.click());
    act(() => button.click());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists the chosen theme to localStorage', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /dark mode|theme/i });

    act(() => button.click());

    expect(window.localStorage.getItem('theme')).toBe('dark');
  });

  it('initializes from a stored dark preference', () => {
    window.localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');

    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /dark mode|theme/i });

    // Already dark, so the first click should switch back to light.
    act(() => button.click());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem('theme')).toBe('light');
  });
});
