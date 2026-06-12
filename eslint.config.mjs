import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tailwindcss from 'eslint-plugin-tailwindcss';
import jsxA11y from 'eslint-plugin-jsx-a11y';

const eslintConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Tooling scripts are CommonJS Node programs, not browser/ESM app code.
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // ESM Node tooling scripts (.mjs): ES modules (import + top-level await),
    // run by `node` — so Node globals, not browser ones.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
      globals: {
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  {
    // Design-system enforcement — keep agent/student UI on the design tokens.
    // Scoped to rendered UI (app/** + components/**). Token-SOURCE files
    // (app/globals.css, tailwind.config.js, DESIGN.md) are not linted here and
    // are allowed to hold raw color values.
    files: ['app/**/*.{ts,tsx,jsx}', 'components/**/*.{ts,tsx,jsx}'],
    plugins: {
      tailwindcss,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      tailwindcss: {
        config: 'tailwind.config.js',
        // Class strings also live inside these helpers, not just className.
        callees: ['cn', 'clsx', 'cva', 'classnames'],
      },
    },
    rules: {
      // Accessibility (shadcn/Radix gives us a head start; keep it).
      ...jsxA11y.flatConfigs.recommended.rules,
      // Hard-coded colors are the #1 "frankenstein" vector — block them.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message:
            'Hard-coded hex color. Use a design token (e.g. bg-primary, text-foreground) from app/globals.css — see DESIGN.md.',
        },
        {
          selector: 'Literal[value=/\\[#[0-9a-fA-F]/]',
          message:
            'Hard-coded hex color in a Tailwind arbitrary value (e.g. bg-[#fff]). Use a token utility like bg-primary — see DESIGN.md.',
        },
        {
          selector: 'TemplateElement[value.raw=/\\[#[0-9a-fA-F]/]',
          message:
            'Hard-coded hex color in a Tailwind arbitrary value. Use a token utility like bg-primary — see DESIGN.md.',
        },
        {
          selector: 'Literal[value=/\\[(?:rgb|hsl)a?\\(/i]',
          message:
            'Hard-coded rgb()/hsl() color in a Tailwind arbitrary value. Use a token utility — see DESIGN.md.',
        },
      ],
      // Conflicting utilities (e.g. px-2 px-4) are real bugs — block them.
      'tailwindcss/no-contradicting-classname': 'error',
      // Magic numbers / off-theme classes — surface as nudges, don't break
      // legitimate layout values like h-[70vh] or vendored shadcn primitives.
      'tailwindcss/no-arbitrary-value': 'warn',
      'tailwindcss/no-custom-classname': 'warn',
    },
  },
  {
    // components/ui/** are canonical shadcn primitives pulled via the CLI
    // (`npx shadcn@latest add`). They legitimately use arbitrary variants
    // (data-[state=...], [&_svg]:...) so the "nudge" rules don't apply — but the
    // hard-coded-color block and a11y rules above still do.
    files: ['components/ui/**/*.{ts,tsx,jsx}'],
    rules: {
      'tailwindcss/no-arbitrary-value': 'off',
      'tailwindcss/no-custom-classname': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      'next-env.d.ts',
      'tests/**',
      'public/**',
      'coverage/**',
      // Vendored Superpowers skills (mirror of github.com/obra/superpowers) —
      // third-party content, not linted (kept byte-identical to upstream).
      '.claude/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
    ],
  },
];

export default eslintConfig;
