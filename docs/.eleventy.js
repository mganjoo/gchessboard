const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownIt = require("markdown-it")({
  html: true,
  breaks: false,
  linkify: true,
});
const outdent = require("outdent");

module.exports = function (eleventyConfig) {
  // Watch on Tailwind files
  eleventyConfig.addWatchTarget("css/");
  eleventyConfig.addWatchTarget("tailwind.config.js");

  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.setLibrary("md", markdownIt);

  eleventyConfig.addPairedShortcode("chessboard", function (children) {
    const template = outdent`
      ${"```"}html ${children} ${"```"}
      <div class="chessboard-wrapper">${children}</div>
    `;
    return markdownIt.render(template);
  });

  eleventyConfig.addPassthroughCopy({
    "node_modules/@fontsource/nunito-sans": "css/fonts/nunito-sans",
  });
  eleventyConfig.addPassthroughCopy({
    "../dist/index.es.js": "lib/gchessboard.js",
  });
  eleventyConfig.addPassthroughCopy({
    "css/prism.css": "css/prism.css",
  });

  return {
    dir: {
      input: "src",
    },
  };
};
