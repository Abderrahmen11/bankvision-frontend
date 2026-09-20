import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ── FSD-lite import boundaries (Phase 5) ────────────────────────────────────
// Enforced with the core no-restricted-imports rule (regex patterns), applied
// per directory via flat-config blocks.
const REMOVED_DIRS = {
  regex: "^@/(pages|api|types|hooks|utils)/",
  message:
    'This directory was removed in the FSD-lite migration. Use @/features/*, @/shared/*, @/store/*, @/layouts/* or @/styles/*.',
}
const FEATURE_INTERNALS = {
  regex: "^@/features/[^/]+/(pages|components|hooks|modals|config)(/|$)",
  message:
    "Feature internals are private. Cross-feature imports must use the feature's index.ts barrel, or its api/* / types module.",
}
const NO_FEATURES = {
  regex: "^@/features/",
  message: "shared/ must not depend on features/.",
}
const STORE_ALLOWED = {
  regex: "^@/features/(?![^/]+/(api/|types$))",
  message: "store/ may only import from features/<name>/api/* and features/<name>/types.",
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // The codebase marks intentionally-unused args/vars with a leading
      // underscore (e.g. formatMoney's legacy-compat parameter); unused catch
      // bindings are harmless.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    // app/ may import from anywhere — no extra restrictions.
    files: ['src/app/**/*.{ts,tsx}'],
  },
  {
    // shared/ must never depend on features.
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [NO_FEATURES, REMOVED_DIRS] }],
    },
  },
  {
    // store/: global Zustand stores — features' api/types only.
    files: ['src/store/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [FEATURE_INTERNALS, STORE_ALLOWED, REMOVED_DIRS] }],
    },
  },
  {
    // layouts/ and shared chrome: feature barrels + shared, no internals.
    files: ['src/layouts/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [FEATURE_INTERNALS, REMOVED_DIRS] }],
    },
  },
  {
    // features/: no other feature's internals — cross-feature via barrel or
    // api/types deep paths only.
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: ['src/features/*/index.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [FEATURE_INTERNALS, REMOVED_DIRS] }],
    },
  },
])
