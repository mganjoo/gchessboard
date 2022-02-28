function element(data) {
  return data.apiSpec.modules[0].exports.find(
    (i) => i.name === "GChessBoardElement"
  );
}

function renderedProperties(data) {
  return data.map((p) => ({
    ...p,
    description: markdownIt.render(p.description),
  }));
}

const markdownIt = require("markdown-it")({
  html: true,
  breaks: false,
  linkify: true,
});

module.exports = {
  eleventyComputed: {
    attributes: (data) => renderedProperties(element(data).attributes),
    cssProperties: (data) => renderedProperties(element(data).cssProperties),
    cssParts: (data) => renderedProperties(element(data).cssParts),
  },
};
