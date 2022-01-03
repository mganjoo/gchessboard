import typescript from "@rollup/plugin-typescript"
import postcss from "rollup-plugin-postcss"
import smartAsset from "rollup-plugin-smart-asset"
import { defineConfig } from "rollup"
import pkg from "./package.json"

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

/** @type {import("rollup-plugin-postcss").PostCSSPluginConf} */
const postCssConfig = {
  minimize: true,
  plugins: [require("autoprefixer")],
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
        name: "chessx",
        file: pkg.browser,
        format: "umd",
        globals: {
          "./sprite.svg": "sprite",
        },
      },
      {
        file: pkg.main,
        format: "cjs",
      },
      {
        file: pkg.module,
        format: "es",
      },
    ],
    plugins: [
      smartAsset(smartAssetConfig),
      typescript(typescriptConfig),
      postcss(postCssConfig),
    ],
  },
])
