module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: "@storybook/html",
  typescript: {
    check: true,
  },
  core: {
    builder: "webpack5",
  },
  features: {
    babelModeV7: true,
    storyStoreV7: true,
  },
}
