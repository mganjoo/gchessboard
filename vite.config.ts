import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import bundlesize from "vite-plugin-bundlesize";
import checker from "vite-plugin-checker";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    sourcemap: true,
  },
  css: {
    postcss: process.cwd(),
  },
  plugins: [
    bundlesize({
      limits: [{ name: "**/*.js", limit: "150 kB", mode: "brotli" }],
    }),
    checker({
      typescript: true,
    }),
    dts({
      include: ["src/**/*.ts"],
      rollupTypes: true,
    }),
  ],
});
