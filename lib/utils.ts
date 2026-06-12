import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names, resolving conflicts (later classes win).
 * Used by all shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a UUID v4. Prefers `crypto.randomUUID`, but `randomUUID` is only
 * exposed in a **secure context** (HTTPS or localhost) — reaching the dev server
 * over `http://<ip>:3000` leaves it undefined and crashes. Fall back to
 * `crypto.getRandomValues` (and, as a last resort, `Math.random`) so a session
 * id can always be produced.
 */
export function generateId(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = c.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
      .slice(6, 8)
      .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Studio Bauhaus card chrome — 2px ink border + hard offset shadow.
 * Use `studioCard` for static panels, `studioCardHover` for interactive cards.
 */
export const studioCard = 'border-2 border-foreground rounded-2xl shadow-hard';

export const studioCardHover =
  studioCard +
  ' transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg';
