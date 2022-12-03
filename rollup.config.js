import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import filesize from "rollup-plugin-filesize";
import dts from "rollup-plugin-dts";
import { defineConfig } from "rollup";
import pkg from "./package.json" assert { type: "json" };

const inputFile = "src/index.ts";
const production = process.env.PRODUCTION === "true";

export default defineConfig([
  {
    input: inputFile,
    output: [{ file: pkg.module, format: "es", sourcemap: true }],
    plugins: [
      postcss({ inject: false, minimize: production }),
      typescript({
        tsconfig: "./tsconfig.json",
        exclude: ["tests/**/*.(ts|tsx)", "./*.ts"],
      }),
      ...(production ? [filesize({ showBrotliSize: true })] : []),
    ],
  },
  {
    input: inputFile,
    output: [{ file: pkg.types, format: "es" }],
    plugins: [dts()],
  },
]);
