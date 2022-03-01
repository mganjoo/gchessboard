function element(data) {
  return data.apiSpec.modules[0].exports.find(
    (i) => i.name === "GChessBoardElement"
  );
}

function renderedProperties(data) {
  return data.map((p) => ({
    ...p,
    default: p.defaultValue || p.default,
    description: markdownIt.render(p.description),
  }));
}

const prism = require("markdown-it-prism");
const markdownIt = require("markdown-it")({
  html: true,
  breaks: false,
  linkify: true,
}).use(prism);

const mappedAttributes = (data) =>
  element(data).attributes.map((a) => a.fieldName);

module.exports = {
  eleventyComputed: {
    attributes: (data) => renderedProperties(element(data).attributes),
    additionalProperties: (data) =>
      renderedProperties(
        element(data).members.filter(
          (m) => m.kind === "field" && !mappedAttributes(data).includes(m.name)
        )
      ),
    cssProperties: (data) => renderedProperties(element(data).cssProperties),
    cssParts: (data) => renderedProperties(element(data).cssParts),
    events: (data) => renderedProperties(element(data).events),
    methods: (data) =>
      renderedProperties(
        element(data).members.filter((m) => m.kind === "method")
      ),
  },
};
