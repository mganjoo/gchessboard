module.exports = {
  extends: ["eslint:recommended", "prettier"],
  parserOptions: {
    ecmaVersion: "2018",
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      plugins: ["@typescript-eslint"],
      parser: "@typescript-eslint/parser",
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
      ],
    },
  ],
  ignorePatterns: [
    "dist",
    "rollup.config.js",
    "!docs/.eleventy.js",
    "!.release-it.ts",
    "playwright-report",
    "_site",
  ],
  rules: {},
};
