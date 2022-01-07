import typescript from "@rollup/plugin-typescript"
import postcss from "rollup-plugin-postcss"
import smartAsset from "rollup-plugin-smart-asset"
import { defineConfig } from "rollup"
import pkg from "./package.json"

/** @type {import("rollup-plugin-postcss").PostCSSPluginConf} */
const postCssConfig = {
  plugins: [require("autoprefixer")],
}

/** @type {import("@rollup/plugin-typescript").RollupTypescriptOptions } */
const typescriptConfig = {
  tsconfig: "./tsconfig.json",
  exclude: [
    "src/**/*.test.(ts|tsx)",
    "src/**/*.stories.(ts|tsx)",
    "src/stories/**/*.(ts|tsx)",
    "./*.ts",
  ],
}

const smartAssetConfig = {
  url: "copy",
  keepImport: true,
}

export default defineConfig([
  {
    input: "src/chessx.ts",
    output: [
      {
        file: pkg.main,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: "es",
        sourcemap: true,
      },
    ],
    plugins: [
      smartAsset(smartAssetConfig),
      postcss(postCssConfig),
      typescript(typescriptConfig),
    ],
  },
])
