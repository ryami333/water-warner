// @ts-check
import eslintJs from "@eslint/js";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptEslintParser from "@typescript-eslint/parser";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist/", "out/"]),
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs}"],
    languageOptions: {
      parser: typescriptEslintParser,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },

    plugins: {
      // @ts-ignore: known upstream issue.
      "@typescript-eslint": typescriptEslintPlugin,
    },

    rules: {
      ...eslintJs.configs.recommended.rules,
      ...typescriptEslintPlugin.configs.recommended.rules,
    },
  },
]);
