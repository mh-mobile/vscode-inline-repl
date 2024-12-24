import {
  TextEditor,
  Range,
  CommentMode,
  MarkdownString,
  Uri,
  Event,
} from "vscode";
import { Kernel, KernelStatus } from "@vscode/jupyter-extension";

export interface ExecutionTask {
  id: string;
  code: string;
  editor: TextEditor;
  range: Range;
  status: "queued" | "executing" | "completed" | "cancelled";
}

export interface ExecutionOutput {
  type: "output" | "error";
  content: string;
  mimeType: string;
  rawContent: Uint8Array;
}

export interface IKernelManager {
  selectKernel(): Promise<Kernel | undefined>;
  getCurrentKernel(): Kernel | undefined;
  restartKernel(): Promise<void>;
  getStatus(): KernelStatus;
  onDidChangeStatus: Event<KernelStatusChangeEvent>;
}

export interface ICodeExecutor {
  execute(
    code: string,
    editor: TextEditor,
    range: Range
  ): AsyncGenerator<ExecutionOutput[]>;
}

export interface IExecutionQueue {
  enqueue(task: ExecutionTask): void;
  cancelQueued(taskId: string): void;
}

export interface IResultRenderer {
  renderExecuting(range: Range): Promise<void>;
  renderResult(
    result: { outputs: ExecutionOutput[] },
    range: Range,
    isExecuting?: boolean
  ): Promise<void>;
  renderError(range: Range, error: Error): Promise<void>;
  renderComplete(range: Range): Promise<void>;
  renderQueued(range: Range): Promise<void>;
  renderCancelled(range: Range): Promise<void>;
  clearResults(docKey: string): void;
}

export interface ReplComment {
  id: string;
  body: string | MarkdownString;
  mode: CommentMode;
  author: {
    name: string;
    iconPath?: Uri;
  };
  contextValue?: string;
  outputContent?: string;
}

export interface KernelStatusChangeEvent {
  status: KernelStatus;
  previousStatus?: KernelStatus;
}
