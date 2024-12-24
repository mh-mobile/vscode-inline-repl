import { ExtensionSpecificContext } from "@inline-repl/core";

export interface RubyContext extends ExtensionSpecificContext {
  language: "ruby";
  kernelDisplayName: string;
}
