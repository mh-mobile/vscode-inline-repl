import { StatusBarItem, window, StatusBarAlignment } from "vscode";
import { KernelStatus } from "@vscode/jupyter-extension";
import { Context } from "../context";

export class StatusBarManager {
  private statusBarItem: StatusBarItem;
  private kernelDisplayName: string;

  constructor() {
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    this.kernelDisplayName = Context.current.specific.kernelDisplayName;
    this.statusBarItem.name = `${this.kernelDisplayName} REPL Status`;
  }

  updateStatus(
    isExecuting: boolean,
    activeTaskCount: number,
    kernelStatus: KernelStatus
  ): void {
    if (["dead", "terminating", "unknown"].includes(kernelStatus)) {
      this.showKernelStatus(kernelStatus);
    } else if (isExecuting) {
      if (activeTaskCount > 1) {
        this.showExecutingWithQueue(activeTaskCount - 1);
      } else {
        this.showExecuting();
      }
    } else if (activeTaskCount > 0) {
      this.showQueued();
    } else {
      this.showIdle(kernelStatus);
    }
  }

  private showExecuting(): void {
    this.statusBarItem.text = `$(sync~spin) Running ${this.kernelDisplayName}`;
    this.statusBarItem.tooltip = `${this.kernelDisplayName} code is executing`;
    this.statusBarItem.show();
  }

  private showExecutingWithQueue(queuedCount: number): void {
    this.statusBarItem.text = `$(sync~spin) Running ${this.kernelDisplayName} (${queuedCount} queued)`;
    this.statusBarItem.tooltip = `Executing ${this.kernelDisplayName} code with ${queuedCount} task${
      queuedCount > 1 ? "s" : ""
    } in queue`;
    this.statusBarItem.show();
  }

  private showQueued(): void {
    this.statusBarItem.text = `$(clock) ${this.kernelDisplayName} Code Queued`;
    this.statusBarItem.tooltip = "Code execution is queued";
    this.statusBarItem.show();
  }

  private showIdle(kernelStatus: KernelStatus): void {
    switch (kernelStatus) {
      case "idle":
        this.statusBarItem.text = `$(check) ${this.kernelDisplayName} Kernel Ready`;
        this.statusBarItem.tooltip = `${this.kernelDisplayName} is idle and ready`;
        break;
      case "starting":
        this.statusBarItem.text = `$(sync~spin) Starting ${this.kernelDisplayName} Kernel`;
        this.statusBarItem.tooltip = `${this.kernelDisplayName} kernel is starting`;
        break;
      case "restarting":
        this.statusBarItem.text = `$(sync~spin) Restarting ${this.kernelDisplayName} Kernel`;
        this.statusBarItem.tooltip = `${this.kernelDisplayName} kernel is restarting`;
        break;
      case "autorestarting":
        this.statusBarItem.text = `$(sync~spin) Auto-restarting ${this.kernelDisplayName} Kernel`;
        this.statusBarItem.tooltip = `${this.kernelDisplayName} kernel is auto-restarting`;
        break;
      case "busy":
        this.statusBarItem.text = `$(sync~spin) ${this.kernelDisplayName} Kernel Busy`;
        this.statusBarItem.tooltip = `${this.kernelDisplayName} kernel is busy`;
        break;
      default:
        this.statusBarItem.hide();
        return;
    }
    this.statusBarItem.show();
  }

  private showKernelStatus(status: KernelStatus): void {
    switch (status) {
      case "dead":
        this.statusBarItem.text = `$(error) ${this.kernelDisplayName} Kernel Dead`;
        this.statusBarItem.tooltip = `${this.kernelDisplayName} kernel has died. Try restarting.`;
        break;
      case "terminating":
        this.statusBarItem.text = `$(warning) ${this.kernelDisplayName} Kernel Terminating`;
        this.statusBarItem.tooltip = `${this.kernelDisplayName} kernel is shutting down`;
        break;
      case "unknown":
        this.statusBarItem.text = `$(question) ${this.kernelDisplayName} Kernel Status Unknown`;
        this.statusBarItem.tooltip = `${this.kernelDisplayName} kernel status is unknown`;
        break;
      default:
        return;
    }
    this.statusBarItem.show();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
