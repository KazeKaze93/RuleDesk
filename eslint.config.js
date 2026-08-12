import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // 1. Игнорируемые папки (сборка, миграции)
  {
    ignores: [
      "dist",
      "out",
      "drizzle",
      "node_modules",
      "coverage",
      "drizzle.config.ts",
    ],
  },

  // 2. Базовая конфигурация (без type-aware rules — tsconfig include: src only)
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Prefer `as` over angle-bracket assertions (object-literal ban is src-only below)
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
        },
      ],
    },
  },

  // 3. Type-aware assertion enforcement (src only — matches tsconfig include)
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.d.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never",
        },
      ],
      // Narrowing-only safety net (kept); full policy gate is no-restricted-syntax below.
      "@typescript-eslint/no-unsafe-type-assertion": "error",
      // Policy gate: every `as` except `as const` requires // boundary: + eslint-disable-next-line
      // (selector verified: as const uses TSTypeReference typeName.name === "const")
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'TSAsExpression:not(:has(> TSTypeReference[typeName.name="const"]))',
          message:
            '`as` type assertions are forbidden except the closed boundary allowlist in .cursorrules. Allowed sites need `// boundary: <reason>` and `eslint-disable-next-line` for every rule that fires (`no-restricted-syntax`; also `@typescript-eslint/no-unsafe-type-assertion` when it reports). Prefer upstream types or Zod.parse. `as const` is allowed.',
        },
      ],
    },
  },

  // 4. Renderer must not import from Main (including type-only).
  // Accidental value imports of schema/providers pull Drizzle / better-sqlite3
  // into the browser bundle. Use @shared/types/* and @shared/schemas/*.
  // src/renderer.d.ts is outside this glob (src/renderer.d.ts ≠ src/renderer/**);
  // it may reference the preload contract in src/main/bridge.ts.
  // src/main/bridge.ts is Main — this rule does not apply to it.
  {
    files: ["src/renderer/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/main",
                "**/main/*",
                "**/main/**",
                "@/main",
                "@/main/*",
                "@/main/**",
              ],
              message:
                "Renderer must not import from src/main/** (including type-only). Use @shared/types/db, @shared/types/bridge, @shared/types/providers, or @shared/schemas/*. A value import of main/db/schema or main/providers pulls Drizzle/better-sqlite3 into the browser bundle.",
            },
          ],
        },
      ],
    },
  }
);
