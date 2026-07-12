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
      // Ban narrowing type assertions; boundary casts use // boundary: + eslint-disable-next-line
      "@typescript-eslint/no-unsafe-type-assertion": "error",
    },
  }
);
