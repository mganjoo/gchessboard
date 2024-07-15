import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { ignores: ["dist", "playwright-report", "_site"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.{cjs,11tydata.js}", "docs/.eleventy.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  }
);
