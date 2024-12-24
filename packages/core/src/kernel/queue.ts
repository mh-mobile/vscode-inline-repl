import { Range } from "vscode";
import {
  ExecutionOutput,
  ExecutionTask,
  IExecutionQueue,
  IKernelManager,
  IResultRenderer,
  ICodeExecutor,
} from "../types";
import { StatusBarManager } from "../ui/statusBar";
import { ExecutionError, KernelError } from "../types/errors";
import { ConfigurationManager } from "../config/manager";

export class ExecutionQueue implements IExecutionQueue {
  private deletedTasks: Set<string> = new Set();
  private queue: ExecutionTask[] = [];
  private isExecuting = false;
  private clearOnExecute: boolean;

  constructor(
    private executor: ICodeExecutor,
    private resultRenderer: IResultRenderer,
    private statusBar: StatusBarManager,
    private kernelManager: IKernelManager,
    configManager: ConfigurationManager
  ) {
    this.clearOnExecute = configManager.get("clearOnExecute");

    configManager.onConfigChange(({ key, value }) => {
      if (key === "clearOnExecute" && typeof value === "boolean") {
        this.clearOnExecute = value;
      }
    });

    this.kernelManager.onDidChangeStatus(() => {
      this.updateStatusBar();
    });
  }

  enqueue(task: ExecutionTask): void {
    if (this.clearOnExecute && task.editor) {
      this.clearQueue();
      const docKey = task.editor.document.uri.toString();
      this.resultRenderer.clearResults(docKey);
    }

    this.queue.push({ ...task, status: "queued" });
    this.updateStatusBar();

    if (!this.isExecuting) {
      this.resultRenderer.renderExecuting(task.range);
      this.processNextTask();
    } else {
      this.resultRenderer.renderQueued(task.range);
    }
  }

  cancelQueued(taskId: string): void {
    const index = this.queue.findIndex((task) => task.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
    this.deletedTasks.add(taskId);
    this.updateStatusBar();
  }

  clearQueue(): void {
    this.queue.forEach((task) => {
      this.deletedTasks.add(task.id);
    });
    this.queue = [];
    this.updateStatusBar();
  }

  private async processNextTask(): Promise<void> {
    if (this.isExecuting || this.queue.length === 0) {
      return;
    }

    const task = this.queue[0];
    if (!task || this.deletedTasks.has(task.id)) {
      this.queue.shift();
      this.updateStatusBar();
      void this.processNextTask();
      return;
    }

    try {
      this.isExecuting = true;
      this.updateStatusBar();
      task.status = "executing";

      let outputs: ExecutionOutput[] = [];
      for await (const output of this.executeWithProgress(task)) {
        if (this.deletedTasks.has(task.id)) {
          break;
        }
        outputs.push(...output);
        await this.resultRenderer.renderResult({ outputs }, task.range, true);
      }

      if (!this.deletedTasks.has(task.id)) {
        if (outputs.length === 0) {
          await this.resultRenderer.renderComplete(task.range);
        } else {
          await this.resultRenderer.renderResult(
            { outputs },
            task.range,
            false
          );
        }
      }

      task.status = "completed";
    } catch (error) {
      if (error instanceof KernelError || error instanceof ExecutionError) {
        await this.resultRenderer.renderError(task.range, error);
      }
    } finally {
      this.isExecuting = false;
      if (!this.deletedTasks.has(task.id)) {
        this.queue.shift();
      }
      this.updateStatusBar();
      if (
        this.queue.length > 0 &&
        !this.queue.every((task) => this.deletedTasks.has(task.id))
      ) {
        void this.processNextTask();
      }
    }
  }

  private async *executeWithProgress(
    task: ExecutionTask
  ): AsyncGenerator<ExecutionOutput[]> {
    for await (const result of this.executor.execute(
      task.code,
      task.editor,
      task.range
    )) {
      yield result;
    }
  }

  findAllTasksByRange(range: Range): ExecutionTask[] {
    return this.queue.filter((task) => this.rangeEquals(task.range, range));
  }

  private rangeEquals(r1: Range, r2: Range): boolean {
    return (
      r1.start.line === r2.start.line &&
      r1.end.line === r2.end.line &&
      r1.start.character === r2.start.character &&
      r1.end.character === r2.end.character
    );
  }

  private updateStatusBar(): void {
    const activeTaskCount = this.queue.filter(
      (task) => !this.deletedTasks.has(task.id)
    ).length;

    const kernelStatus = this.kernelManager.getStatus();
    this.statusBar.updateStatus(
      this.isExecuting,
      activeTaskCount,
      kernelStatus
    );
  }
}
