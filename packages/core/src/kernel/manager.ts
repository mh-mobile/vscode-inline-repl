import { window, EventEmitter, Event, commands } from "vscode";
import { Kernel, KernelStatus } from "@vscode/jupyter-extension";
import { IKernelManager, KernelStatusChangeEvent } from "../types";
import { KernelError } from "../types/errors";

export abstract class BaseKernelManager implements IKernelManager {
  protected currentKernel?: Kernel;
  protected currentStatus: KernelStatus = "unknown";
  private readonly _onDidChangeStatus =
    new EventEmitter<KernelStatusChangeEvent>();
  protected disposables: { dispose(): void }[] = [];

  readonly onDidChangeStatus: Event<KernelStatusChangeEvent> =
    this._onDidChangeStatus.event;

  constructor() {
    this.disposables.push(this._onDidChangeStatus);
  }

  abstract selectKernel(): Promise<Kernel | undefined>;

  getCurrentKernel(): Kernel | undefined {
    return this.currentKernel;
  }

  getStatus(): KernelStatus {
    return this.currentStatus;
  }

  async restartKernel(): Promise<void> {
    try {
      this.updateStatus("restarting");
      this.currentKernel = undefined;
      await commands.executeCommand("jupyter.restartkernel");
      this.currentKernel = await this.selectKernel();
      if (this.currentKernel !== undefined) {
        window.showInformationMessage(
          `${this.currentKernel.language} kernel restarted successfully`
        );
      }
      this.updateStatus("idle");
    } catch (error) {
      this.updateStatus("dead");
      if (error instanceof KernelError) {
        throw error;
      }
      throw new KernelError(
        `Failed to restart kernel: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  protected abstract doRestartKernel(): Promise<void>;

  protected updateStatus(newStatus: KernelStatus) {
    if (this.currentStatus !== newStatus) {
      const event: KernelStatusChangeEvent = {
        status: newStatus,
        previousStatus: this.currentStatus,
      };

      this.currentStatus = newStatus;
      this._onDidChangeStatus.fire(event);
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
