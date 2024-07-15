/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    autoprefixer: {},
    "postcss-url": {
      url: "inline",
      encodeType: "encodeURIComponent",
      optimizeSvgEncode: true,
    },
  },
};

module.exports = config;
