import {
  ExtensionContext,
  window,
  commands,
  OutputChannel,
  env,
  CommentThread,
} from "vscode";
import {
  CommentThreadManager,
  ExecutionQueue,
  ResultRenderer,
  StatusBarManager,
  WebviewManager,
  CodeReader,
  Context,
} from "@inline-repl/core";
import { RustKernelManager } from "./kernel/manager";
import { RustConfigurationManager } from "./config/manager";
import { RustContext } from "./context/types";
import { CONTEXT_CONFIG } from "./context/constants";
import { RustCodeExecutor } from "./kernel/executor";

export function activate(context: ExtensionContext) {
  const rustContext = Context.initialize<RustContext>(CONTEXT_CONFIG);
  const logger: OutputChannel = window.createOutputChannel("Rust Inline REPL");
  const kernelManager = new RustKernelManager();
  const codeReader = new CodeReader();
  const threadManager = new CommentThreadManager();
  const configManager = new RustConfigurationManager();
  const resultRenderer = new ResultRenderer(threadManager, configManager);

  const statusBar = new StatusBarManager();
  const webviewManager = new WebviewManager();
  const executor = new RustCodeExecutor(kernelManager, logger);

  const executionQueue = new ExecutionQueue(
    executor,
    resultRenderer,
    statusBar,
    kernelManager,
    configManager
  );

  const extensionPrefix = rustContext.core.extensionPrefix;

  context.subscriptions.push(
    commands.registerCommand(`${extensionPrefix}.executeCode`, async () => {
      const editor = window.activeTextEditor;
      if (!editor) {
        window.showErrorMessage("No active editor found");
        return;
      }

      try {
        if (!kernelManager.getCurrentKernel()) {
          await kernelManager.selectKernel();
        }

        const code = codeReader.readCode(editor);
        if (!code) {
          return;
        }

        let range = codeReader.getExecutionRange(editor);
        const task = {
          id: crypto.randomUUID(),
          code,
          editor,
          range,
          status: "queued" as const,
        };

        resultRenderer.revealRangeInCenter(editor, range);
        executionQueue.enqueue(task);
      } catch (error) {
        logger.appendLine(`Error: ${error}`);
        window.showErrorMessage(`Error executing code: ${error}`);
      }
    }),

    commands.registerCommand(`${extensionPrefix}.clearOutput`, () => {
      const editor = window.activeTextEditor;
      if (editor) {
        executionQueue.clearQueue();
        const docKey = editor.document.uri.toString();
        threadManager.clearThreads(docKey);
      }
    }),

    commands.registerCommand(`${extensionPrefix}.restartKernel`, async () => {
      await kernelManager.restartKernel();
    }),

    commands.registerCommand(
      `${extensionPrefix}.manageKernelAccess`,
      async () => {
        await commands.executeCommand("jupyter.manageAccessToKernels");
      }
    ),

    commands.registerCommand(`${extensionPrefix}.copyOutput`, async (args) => {
      if (args?.outputContent) {
        await env.clipboard.writeText(args.outputContent);
        window.showInformationMessage("Output copied to clipboard");
      }
    }),

    commands.registerCommand(`${extensionPrefix}.openInBuffer`, (args) => {
      if (args?.outputContent) {
        webviewManager.openInBuffer(args.outputContent, args.isHtml);
      }
    }),

    commands.registerCommand(
      `${extensionPrefix}.closeThread`,
      (thread: CommentThread) => {
        const docKey = thread.uri.toString();
        threadManager.removeThread(docKey, thread);
        thread.dispose();
      }
    ),

    logger,
    configManager,
    resultRenderer,
    statusBar,
    webviewManager,
    kernelManager
  );
}

export function deactivate() {}
