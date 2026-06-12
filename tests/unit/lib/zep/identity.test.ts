/** @jest-environment node */
import type { User } from '@supabase/supabase-js';
import { toZepUser, displayName } from '@/lib/zep/identity';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'jane@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as User;
}

describe('toZepUser', () => {
  it('maps id and email', () => {
    const z = toZepUser(makeUser());
    expect(z.userId).toBe('user-123');
    expect(z.email).toBe('jane@example.com');
  });

  it('splits a full name from metadata into first/last', () => {
    const z = toZepUser(
      makeUser({ user_metadata: { full_name: 'Jane Q Doe' } } as Partial<User>)
    );
    expect(z.firstName).toBe('Jane');
    expect(z.lastName).toBe('Q Doe');
  });

  it('handles a single-word name (no last name)', () => {
    const z = toZepUser(
      makeUser({ user_metadata: { name: 'Madonna' } } as Partial<User>)
    );
    expect(z.firstName).toBe('Madonna');
    expect(z.lastName).toBeUndefined();
  });

  it('omits names when no metadata name is present', () => {
    const z = toZepUser(makeUser());
    expect(z.firstName).toBeUndefined();
    expect(z.lastName).toBeUndefined();
  });
});

describe('displayName', () => {
  it('prefers the metadata name', () => {
    expect(
      displayName(
        makeUser({ user_metadata: { full_name: 'Jane Doe' } } as Partial<User>)
      )
    ).toBe('Jane Doe');
  });
  it('falls back to email then a generic label', () => {
    expect(displayName(makeUser())).toBe('jane@example.com');
    expect(displayName(makeUser({ email: undefined } as Partial<User>))).toBe(
      'User'
    );
  });
});
