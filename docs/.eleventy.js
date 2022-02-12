module.exports = function (eleventyConfig) {
  // Watch on Tailwind files
  eleventyConfig.addWatchTarget("css/");
  eleventyConfig.addWatchTarget("tailwind.config.js");

  // Copy custom fonts
  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource/nunito-sans": "css/fonts/nunito-sans",
  });
  return {};
};
