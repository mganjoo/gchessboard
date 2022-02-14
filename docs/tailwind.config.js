module.exports = {
  content: ["src/**/*.njk", "src/**/*.html", "src/**/*.md", ".eleventy.js"],
  theme: {
    fontFamily: {
      sans: ["Nunito Sans", "sans-serif"],
      monospace: ["ui-monospace", "SFMono-Regular", "monospace"],
    },
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
