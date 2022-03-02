const syntaxHighlightPlugin = require("@11ty/eleventy-plugin-syntaxhighlight");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItClass = require("@toycode/markdown-it-class");
const markdownIt = require("markdown-it")({
  html: true,
  breaks: false,
  linkify: true,
})
  .use(markdownItAnchor, {
    permalink: true,
    permalinkClass: "page-heading-anchor",
    permalinkSymbol: "#",
    level: [1, 2, 3, 4],
  })
  .use(markdownItClass, {
    h1: "page-heading",
    h2: "page-heading",
    h3: "page-heading",
    h4: "page-heading",
    h5: "page-heading",
    h6: "page-heading",
  });
const outdent = require("outdent");

module.exports = function (eleventyConfig) {
  // Watch on Tailwind files
  eleventyConfig.addWatchTarget("css/");
  eleventyConfig.addWatchTarget("tailwind.config.js");

  eleventyConfig.addPlugin(syntaxHighlightPlugin);
  eleventyConfig.setLibrary("md", markdownIt);

  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  eleventyConfig.addPairedShortcode("chessboard", function (children) {
    const template = outdent`
      ${"```"}html ${children} ${"```"}
      <div class="chessboard-wrapper">${children}</div>
    `;
    return markdownIt.render(template);
  });

  eleventyConfig.addPairedShortcode("chessboardjs", function (children) {
    const template = outdent`
      ${"```"}js ${children} ${"```"}
      <script type="module">${children}</script>
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
    pathPrefix: "/gchessboard/",
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
