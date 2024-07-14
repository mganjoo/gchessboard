/** @type {import('stylelint').Config} */
const config = {
  extends: [
    "stylelint-config-standard",
    "stylelint-prettier/recommended",
    "stylelint-config-idiomatic-order",
  ],
  rules: {
    "selector-class-pattern": [
      "^([a-z][a-z0-9]*)(--?[a-z0-9]+)*$",
      {
        message: "Expected class selector to be kebab-case",
      },
    ],
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["tailwind", "apply", "layer"],
      },
    ],
  },
  ignoreFiles: ["docs/_site/**/*.css", "docs/css/prism.css"],
};

module.exports = config;
