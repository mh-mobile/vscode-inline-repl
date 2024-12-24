import { ExtensionSpecificContext } from "@inline-repl/core";

export interface RustContext extends ExtensionSpecificContext {
  language: "rust";
  kernelDisplayName: string;
}
