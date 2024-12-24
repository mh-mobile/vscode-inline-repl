import path from "path";
import { buildExtension } from "../../scripts/build";

const config = {
  entryPoint: path.join(__dirname, "src/extension.ts"),
  outDir: path.join(__dirname, "dist"),
  packageDir: __dirname,
  watch: process.argv.includes("--watch"),
};

buildExtension(config);
