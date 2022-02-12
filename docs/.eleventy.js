var syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (eleventyConfig) {
  // Watch on Tailwind files
  eleventyConfig.addWatchTarget("css/");
  eleventyConfig.addWatchTarget("tailwind.config.js");

  // Plugins
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource/nunito-sans": "css/fonts/nunito-sans",
  });
  eleventyConfig.addPassthroughCopy({
    "../dist/index.es.js": "lib/gchessboard.js",
  });
  eleventyConfig.addPassthroughCopy({
    "css/prism.css": "css/prism.css",
  });
  return {};
};
