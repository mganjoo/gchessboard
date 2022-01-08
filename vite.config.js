import { resolve } from "path"
import { defineConfig } from "vite"

module.exports = defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["cjs", "es"],
      fileName: (format) => `chessx.${format}.js`,
    },
  },
})
