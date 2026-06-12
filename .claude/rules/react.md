---
description: RSC-first, component structure order, performance
globs: 'app/**/*.tsx,components/**/*.tsx'
---

# React & Front-End (applies to `app/**/*.tsx`, `components/**/*.tsx`)

- **RSC first**: favor React Server Components. Minimize `'use client'`, `useEffect`, and
  `useState`.
- **Component structure order (MANDATORY)** inside a component:
  1. `useState` declarations
  2. Computed values (`const isRunning = status === 'RUNNING'`)
  3. Function definitions (`handle...`, `fetch...`)
  4. `useEffect` hooks (declare all dependencies _before_ the `useEffect` call)
  5. The JSX `return`
- **File structure**: exported component first, then subcomponents, helpers, static content,
  and finally type definitions. Co-locate props interfaces with their components.
- **Component definition**: use `function`, not `const`, for components.
- **Performance**: `next/dynamic` for non-critical components; `next/image` for images.
- **Async**: prefer `async/await` over raw Promises.
