import type { User } from '@supabase/supabase-js';

export interface ZepUserFields {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

function metadataName(user: User): string | undefined {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = meta.full_name ?? meta.name;
  return typeof name === 'string' && name.trim() ? name.trim() : undefined;
}

/** Map a Supabase user to the fields Zep's user.add expects. */
export function toZepUser(user: User): ZepUserFields {
  const name = metadataName(user);
  const parts = name ? name.split(/\s+/) : [];
  const firstName = parts.shift();
  const lastName = parts.length ? parts.join(' ') : undefined;
  return {
    userId: user.id,
    email: user.email ?? undefined,
    firstName: firstName || undefined,
    lastName,
  };
}

/** Human label for the message `name` field on user messages. */
export function displayName(user: User): string {
  return metadataName(user) ?? user.email ?? 'User';
}
