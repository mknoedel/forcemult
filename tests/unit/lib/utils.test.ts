import { cn, generateId } from '@/lib/utils';
import { studioCard, studioCardHover } from '@/lib/utils';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateId', () => {
  it('returns a UUID v4 string', () => {
    expect(generateId()).toMatch(UUID_V4);
  });

  it('returns unique values across calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('falls back when crypto.randomUUID is unavailable (insecure context)', () => {
    // Simulate http://<ip> contexts where randomUUID is not exposed but
    // getRandomValues still is.
    const real = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: { getRandomValues: real.getRandomValues.bind(real) },
      configurable: true,
    });
    try {
      expect(generateId()).toMatch(UUID_V4);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: real,
        configurable: true,
      });
    }
  });
});

describe('cn', () => {
  it('merges multiple class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resolves conflicting Tailwind classes (later wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('ignores falsey/conditional values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('supports conditional object and array inputs', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c');
  });
});

describe('studio card classes', () => {
  it('studioCard carries the ink border and hard shadow', () => {
    expect(studioCard).toContain('border-foreground');
    expect(studioCard).toContain('shadow-hard');
  });

  it('studioCardHover extends studioCard with a hover transform', () => {
    expect(studioCardHover.startsWith(studioCard)).toBe(true);
    expect(studioCardHover).toContain('hover:shadow-hard-lg');
  });
});
