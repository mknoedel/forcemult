import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * A lightweight select built on the native `<select>` element.
 *
 * shadcn/ui also ships a Radix-based Select with a custom popover. We use the
 * native element here because it is accessible by default, works without
 * client-side JS, and plays nicely with form libraries and testing tools
 * (e.g. Testing Library's `selectOptions`). Swap in the Radix version from
 * https://ui.shadcn.com/docs/components/select if you need richer styling.
 */
const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<'select'>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
  </div>
));
Select.displayName = 'Select';

export { Select };
