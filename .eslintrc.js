module.exports = {
  extends: ["eslint:recommended", "prettier"],
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
  ignorePatterns: ["dist", "!docs/.eleventy.js"],
  rules: {},
};
