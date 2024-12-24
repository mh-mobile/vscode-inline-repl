import {
  BaseCodeExecutor,
  ExecutionError,
  ExecutionOutput,
  IKernelManager,
} from "@inline-repl/core";
import { OutputChannel } from "vscode";
import { RustErrorContent, RustErrorContentSchema } from "../types/error";
import { parse, safeParse } from "valibot";

export class RustCodeExecutor extends BaseCodeExecutor {
  constructor(kernelManager: IKernelManager, logger: OutputChannel) {
    super(kernelManager, logger);
  }

  parseErrorContent(content: string): ExecutionOutput {
    try {
      const errorData = JSON.parse(content);
      const validContent: RustErrorContent = parse(
        RustErrorContentSchema,
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
      const result = safeParse(RustErrorContentSchema, data);
      return result.success;
    } catch {
      return false;
    }
  }
}
