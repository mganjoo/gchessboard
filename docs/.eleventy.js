module.exports = function (eleventyConfig) {
  eleventyConfig.addWatchTarget("css/");
  eleventyConfig.addWatchTarget("tailwind.config.js");
  return {};
};
