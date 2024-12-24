import { extensions, workspace, commands } from "vscode";
import { Jupyter, Kernel } from "@vscode/jupyter-extension";
import { KernelError, BaseKernelManager, Context } from "@inline-repl/core";

export class RustKernelManager extends BaseKernelManager {
  private readonly language: string;
  private readonly kernelDisplayName: string;

  constructor() {
    super();
    this.language = Context.current.specific.language;
    this.kernelDisplayName = Context.current.specific.kernelDisplayName;
  }

  async selectKernel(): Promise<Kernel | undefined> {
    const extension = extensions.getExtension<Jupyter>("ms-toolsai.jupyter");
    if (!extension) {
      throw new KernelError("Jupyter extension not installed");
    }
    await extension.activate();

    if (workspace.notebookDocuments.length === 0) {
      throw new KernelError(
        `No notebooks open. Open a notebook with ${this.kernelDisplayName} kernel first.`
      );
    }

    const api = extension.exports;
    for (const document of workspace.notebookDocuments) {
      const kernel = await api.kernels.getKernel(document.uri);
      if (kernel && kernel.language === this.language) {
        this.currentKernel = kernel;

        kernel.onDidChangeStatus((status) => {
          this.updateStatus(status);
        });

        return kernel;
      }
    }

    throw new KernelError(`No ${this.kernelDisplayName} kernel available`);
  }

  protected async doRestartKernel(): Promise<void> {
    await commands.executeCommand("jupyter.restartkernel");
  }
}
