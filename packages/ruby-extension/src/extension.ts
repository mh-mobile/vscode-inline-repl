import {
  ExtensionContext,
  window,
  commands,
  OutputChannel,
  env,
  CommentThread,
} from "vscode";
import {
  CodeReader,
  CommentThreadManager,
  Context,
  ExecutionQueue,
  ResultRenderer,
  StatusBarManager,
  WebviewManager,
} from "@inline-repl/core";
import { RubyKernelManager } from "./kernel/manager";
import { RubyConfigurationManager } from "./config/manager";

import { RubyContext } from "./context/types";
import { RubyCodeExecutor } from "./kernel/executor";
import { CONTEXT_CONFIG } from "./context/constants";
import { config } from "process";

export function activate(context: ExtensionContext) {
  const rubyContext = Context.initialize<RubyContext>(CONTEXT_CONFIG);
  const logger: OutputChannel = window.createOutputChannel("Ruby Inline REPL");
  const kernelManager = new RubyKernelManager();
  const codeReader = new CodeReader();
  const threadManager = new CommentThreadManager();
  const configManager = new RubyConfigurationManager();
  const resultRenderer = new ResultRenderer(threadManager, configManager);

  const statusBar = new StatusBarManager();
  const webviewManager = new WebviewManager();
  const executor = new RubyCodeExecutor(kernelManager, logger);

  const executionQueue = new ExecutionQueue(
    executor,
    resultRenderer,
    statusBar,
    kernelManager,
    configManager
  );

  const extensionPrefix = rubyContext.core.extensionPrefix;

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
