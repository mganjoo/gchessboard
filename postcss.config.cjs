module.exports = {
  plugins: {
    autoprefixer: {},
    "postcss-url": {
      url: "inline",
      encodeType: "encodeURIComponent",
      optimizeSvgEncode: true,
    },
  },
};
