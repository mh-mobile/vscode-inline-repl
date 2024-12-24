import {
  BaseCodeExecutor,
  ExecutionError,
  ExecutionOutput,
  IKernelManager,
} from "@inline-repl/core";
import { OutputChannel } from "vscode";
import { parse, safeParse } from "valibot";
import { RubyErrorContent, RubyErrorContentSchema } from "../types/error";

export class RubyCodeExecutor extends BaseCodeExecutor {
  constructor(kernelManager: IKernelManager, logger: OutputChannel) {
    super(kernelManager, logger);
  }

  parseErrorContent(content: string): ExecutionOutput {
    try {
      const errorData = JSON.parse(content);
      const validContent: RubyErrorContent = parse(
        RubyErrorContentSchema,
        errorData
      );

      const stack = validContent.stack || validContent.message;

      return {
        type: "error",
        content: stack,
        mimeType: "text/plain",
        rawContent: new TextEncoder().encode(content),
      };
    } catch (parseError) {
      throw new ExecutionError(
        parseError instanceof Error ? parseError.message : String(parseError)
      );
    }
  }

  isErrorContent(content: string): boolean {
    try {
      const data = JSON.parse(content);
      const result = safeParse(RubyErrorContentSchema, data);
      return result.success;
    } catch {
      return false;
    }
  }
}
