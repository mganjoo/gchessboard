module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
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
  webpackFinal: async (config) => {
    const nonCssRules = config.module.rules.filter(
      (rule) => rule.test.source !== /\.css$/.source
    )
    config.module.rules = [
      ...nonCssRules,
      {
        test: /\.css(\?inline)?$/,
        use: [
          {
            loader: "css-loader",
            options: {
              exportType: "string",
            },
          },
        ],
      },
    ]
    return config
  },
}
