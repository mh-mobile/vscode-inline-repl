import * as esbuild from "esbuild";
import { copy } from "esbuild-plugin-copy";
import path from "path";

export interface BuildConfig {
  entryPoint: string;
  outDir: string;
  packageDir: string;
  watch?: boolean;
}

export const createBaseConfig = (
  config: BuildConfig
): esbuild.BuildOptions => ({
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: "node",
  target: "node16",
  format: "cjs",
  logLevel: "info",
  entryPoints: [config.entryPoint],
  outfile: path.join(config.outDir, "extension.js"),
  external: ["vscode", "@vscode/jupyter-extension"],
  plugins: [
    {
      name: "workspace-resolver",
      setup(build) {
        console.log("Resolving from:", config.packageDir);
        const corePath = config.watch
          ? path.resolve(config.packageDir, "../core/src/index.ts")
          : path.resolve(config.packageDir, "../core/dist/index.js");
        build.onResolve({ filter: /^@inline-repl\/core$/ }, async () => {
          return {
            path: corePath,
          };
        });
      },
    },
    copy({
      resolveFrom: "cwd",
      assets: {
        from: [path.join(config.packageDir, "images/*")],
        to: [path.join(config.outDir, "images")],
      },
    }),
  ],
});

export async function buildExtension(config: BuildConfig) {
  try {
    const buildOptions = createBaseConfig(config);

    if (config.watch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log("Initial build succeeded");
      console.log("watch build succeeded");
    } else {
      await esbuild.build(buildOptions);
      console.log("Build completed successfully");
    }
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}
