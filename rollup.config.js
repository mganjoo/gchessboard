import typescript from "@rollup/plugin-typescript"
import images from "rollup-plugin-image-files"
import postcss from "rollup-plugin-postcss"
import { defineConfig } from "rollup"
import pkg from "./package.json"

/** @type {import("@rollup/plugin-typescript").RollupTypescriptOptions } */
const typescriptConfig = {
  tsconfig: "./tsconfig.json",
  exclude: ["src/**/*.test.(ts|tsx)", "src/**/*.stories.(ts|tsx)"],
}

/** @type {import("rollup-plugin-postcss").PostCSSPluginConf} */
const postCssConfig = {
  minimize: true,
}

export default defineConfig([
  {
    input: "src/chessx.ts",
    output: {
      name: "chessx",
      file: pkg.browser,
      format: "umd",
    },
    plugins: [
      typescript(typescriptConfig), // so Rollup can convert TypeScript to JavaScript
      postcss(postCssConfig),
      images(),
    ],
  },
  {
    input: "src/chessx.ts",
    external: ["src/styles.css"],
    output: [
      {
        file: pkg.main,
        format: "cjs",
      },
      {
        file: pkg.module,
        format: "es",
      },
    ],
    plugins: [typescript(typescriptConfig), postcss(postCssConfig), images()],
  },
])
