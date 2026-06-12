/**
 * lint-staged configuration.
 * Runs on staged files before each commit (invoked by .husky/pre-commit).
 * ESLint auto-fixes app/lib/components/types source; Prettier formats everything
 * except the AGENTS.md symlink (Prettier errors when handed a symlink directly).
 */
const { basename } = require('node:path');

module.exports = {
  '{app,components,lib,types}/**/*.{ts,tsx,js,jsx}': [
    'eslint --fix --no-warn-ignored',
  ],
  '**/*.{ts,tsx,js,jsx,json,css,md}': (files) => {
    const targets = files.filter((f) => basename(f) !== 'AGENTS.md');
    return targets.length
      ? [`prettier --write ${targets.map((f) => JSON.stringify(f)).join(' ')}`]
      : [];
  },
};
