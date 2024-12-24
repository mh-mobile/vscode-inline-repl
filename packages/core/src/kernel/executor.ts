import {
  TextEditor,
  Range,
  OutputChannel,
  CancellationTokenSource,
} from "vscode";
import { ICodeExecutor, ExecutionOutput, IKernelManager } from "../types";
import { TextDecoder } from "util";
import { ExecutionError, KernelError } from "../types/errors";
import { OutputItem } from "@vscode/jupyter-extension";

export abstract class BaseCodeExecutor implements ICodeExecutor {
  constructor(
    protected kernelManager: IKernelManager,
    protected logger: OutputChannel
  ) {}

  async *execute(
    code: string,
    _editor: TextEditor,
    _range: Range
  ): AsyncGenerator<ExecutionOutput[]> {
    const kernel = this.kernelManager.getCurrentKernel();
    if (!kernel) {
      throw new KernelError("No kernel available");
    }

    const tokenSource = new CancellationTokenSource();
    try {
      for await (const output of kernel.executeCode(code, tokenSource.token)) {
        for (const outputItem of output.items) {
          const outputs: ExecutionOutput[] = this.parseOutputItem(outputItem);
          yield outputs;
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Kernel is disposed")
      ) {
        throw new KernelError("No kernel available");
      }
      throw error;
    } finally {
      tokenSource.dispose();
    }
  }

  protected parseOutputItem(outputItem: OutputItem): ExecutionOutput[] {
    const outputs: ExecutionOutput[] = [];
    const content = new TextDecoder().decode(outputItem.data);

    if (this.isErrorContent(content)) {
      outputs.push(this.parseErrorContent(content));
    } else {
      outputs.push(this.parseOkContent(content, outputItem));
    }
    this.logger.appendLine(`Output (${outputItem.mime}): ${content}`);
    return outputs;
  }

  protected parseOkContent(
    content: string,
    outputItem: OutputItem
  ): ExecutionOutput {
    return {
      type: "output",
      content,
      mimeType: outputItem.mime,
      rawContent: outputItem.data,
    };
  }

  protected parseErrorContent(content: string): ExecutionOutput {
    try {
      const errorData = JSON.parse(content);
      const stack = errorData.stack || content;
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

  protected isErrorContent(content: string): boolean {
    return content.startsWith("{") && content.includes('"name": "Error"');
  }
}
