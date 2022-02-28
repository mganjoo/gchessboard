function elementValues(data) {
  return data.apiSpec.modules[0].exports.find(
    (i) => i.name === "GChessBoardElement"
  );
}

function cssProperties(data) {
  return elementValues(data).cssProperties.map((p) => ({
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
    cssProperties: (data) => cssProperties(data),
  },
};
