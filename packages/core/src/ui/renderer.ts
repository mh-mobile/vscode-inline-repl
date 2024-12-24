import {
  CommentController,
  comments,
  Range,
  Uri,
  CommentMode,
  MarkdownString,
  CommentThread,
  CommentThreadCollapsibleState,
  TextEditor,
  window,
  TextEditorRevealType,
} from "vscode";
import { IResultRenderer, ReplComment, ExecutionOutput } from "../types";
import { CommentThreadManager } from "../output/threadManager";
import { stripAnsiCodes } from "../utils/stringUtils";
import { Context } from "../context";
import puppeteer, { Browser } from "puppeteer-core";
import { ConfigurationManager } from "../config/manager";

export class ResultRenderer implements IResultRenderer {
  private commentController: CommentController;
  private extensionPrefix: string;
  private commentIconPath?: Uri;
  private browser: Browser | null = null;

  constructor(
    private threadManager: CommentThreadManager,
    private configManager: ConfigurationManager
  ) {
    this.extensionPrefix = Context.current.core.extensionPrefix;
    let iconPath = Context.current.core.comment_icon_path;
    this.commentIconPath = iconPath ? Uri.parse(iconPath) : undefined;

    this.commentController = comments.createCommentController(
      `${this.extensionPrefix}.commentController`,
      "REPL Output"
    );
  }

  async renderExecuting(range: Range): Promise<void> {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    const thread = this.createOrGetThread(editor, range);
    const executingContent = new MarkdownString();
    executingContent.supportHtml = true;
    executingContent.supportThemeIcons = true;
    executingContent.isTrusted = true;

    executingContent.appendMarkdown("\n\n\n");
    executingContent.appendMarkdown(`$(sync~spin) Executing...`);

    await this.updateThread(thread, executingContent);
  }

  async renderResult(
    result: { outputs: ExecutionOutput[] },
    range: Range,
    isExecuting: boolean = false
  ): Promise<void> {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    const thread = this.createOrGetThread(editor, range);
    const content = new MarkdownString();
    content.supportHtml = true;
    content.supportThemeIcons = true;
    content.isTrusted = true;

    let plainTextOutput = "";
    let errorOccurred = false;
    let containBinary = false;

    for (const [index, output] of result.outputs.entries()) {
      if (index > 0) {
        plainTextOutput += "\n";
      }
      plainTextOutput += stripAnsiCodes(output.content);
    }

    for (const [index, output] of result.outputs.entries()) {
      if (index > 0) {
        content.appendMarkdown("\n");
      }

      if (output.type === "error") {
        content.appendMarkdown(
          "```\n" + stripAnsiCodes(output.content) + "\n```\n"
        );
        errorOccurred = true;
      } else if (output.mimeType.startsWith("image/")) {
        containBinary = true;
        const base64Data = Buffer.from(output.rawContent).toString("base64");
        content.appendMarkdown(
          `![Output](data:${output.mimeType};base64,${base64Data})\n`
        );
      } else if (output.mimeType === "text/html") {
        containBinary = true;
        const commandUri = Uri.parse(
          `command:${this.extensionPrefix}.openInBuffer?${encodeURIComponent(
            JSON.stringify({
              outputContent: output.content,
              isHtml: true,
            })
          )}`
        ).toString();

        const chromePath: string = this.configManager.get("chromeExecutable");
        if (chromePath && chromePath.trim() !== "") {
          try {
            const base64Image = await this.renderWithPuppeteer(output.content);
            content.appendMarkdown(`![Output](${base64Image})\n`);
          } catch (error) {
            console.error("Failed to render with Puppeteer:", error);
            content.appendMarkdown(
              `\n$(browser) [Preview HTML](${commandUri})\n`
            );
          }
        } else {
          content.appendMarkdown(
            `\n$(browser) [Preview HTML](${commandUri})\n`
          );
        }
      } else {
        content.appendMarkdown("```\n" + output.content + "\n```\n");
      }
    }

    if (!errorOccurred && isExecuting) {
      content.appendMarkdown("\n\n\n");
      content.appendMarkdown(`$(sync~spin) Executing...`);
    }

    if (!containBinary) {
      const openInBufferCommandUri = Uri.parse(
        `command:${this.extensionPrefix}.openInBuffer?${encodeURIComponent(
          JSON.stringify({
            outputContent: plainTextOutput,
            isHtml: false,
          })
        )}`
      ).toString();

      const copyOutputCommandUri = Uri.parse(
        `command:${this.extensionPrefix}.copyOutput?${encodeURIComponent(
          JSON.stringify({ outputContent: plainTextOutput })
        )}`
      ).toString();

      content.appendMarkdown("\n\n---\n");
      content.appendMarkdown(
        `$(copy) [Copy](${copyOutputCommandUri}) | $(output) [Open in Buffer](${openInBufferCommandUri})`
      );
    }

    await this.updateThread(thread, content, plainTextOutput);
  }

  async renderComplete(range: Range): Promise<void> {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    const thread = this.createOrGetThread(editor, range);
    const content = new MarkdownString();
    content.supportThemeIcons = true;
    content.appendMarkdown("$(check) Completed");

    await this.updateThread(thread, content);
  }

  async renderError(range: Range, error: Error): Promise<void> {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    const thread = this.createOrGetThread(editor, range);
    const content = new MarkdownString();
    content.supportHtml = true;
    content.supportThemeIcons = true;
    content.isTrusted = true;

    content.appendMarkdown("$(error) Error: " + error.message);

    await this.updateThread(thread, content);
  }

  async renderQueued(range: Range): Promise<void> {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    const thread = this.createOrGetThread(editor, range);
    const content = new MarkdownString();
    content.supportHtml = true;
    content.supportThemeIcons = true;
    content.isTrusted = true;

    content.appendMarkdown("\n\n\n");
    content.appendMarkdown(`$(clock) Queued...`);

    await this.updateThread(thread, content);
  }

  async renderCancelled(range: Range): Promise<void> {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    const thread = this.createOrGetThread(editor, range);
    const content = new MarkdownString();
    content.supportHtml = true;
    content.supportThemeIcons = true;
    content.isTrusted = true;

    content.appendMarkdown(`$(circle-slash) Cancelled`);

    await this.updateThread(thread, content);
  }

  clearResults(docKey: string): void {
    this.threadManager.clearThreads(docKey);
  }

  dispose(): void {
    this.commentController.dispose();
  }

  revealRangeInCenter(editor: TextEditor, range: Range) {
    const endLineRange = new Range(
      range.end.line,
      0,
      range.end.line,
      editor.document.lineAt(range.end.line).text.length
    );
    editor.revealRange(endLineRange, TextEditorRevealType.InCenter);
  }

  private createOrGetThread(editor: TextEditor, range: Range): CommentThread {
    const docKey = editor.document.uri.toString();
    const existingThread = this.threadManager.findThreadInRange(docKey, range);

    if (existingThread) {
      return existingThread;
    }

    const thread = this.commentController.createCommentThread(
      editor.document.uri,
      range,
      []
    );

    thread.collapsibleState = CommentThreadCollapsibleState.Expanded;
    thread.canReply = false;
    thread.label = "REPL OUTPUT";
    thread.contextValue = `${this.extensionPrefix}CanDelete`;

    this.threadManager.addThread(docKey, thread);
    return thread;
  }

  private async updateThread(
    thread: CommentThread,
    content: MarkdownString,
    outputContent?: string
  ): Promise<void> {
    const comment: ReplComment = {
      id: crypto.randomUUID(),
      body: content,
      mode: CommentMode.Preview,
      author: {
        name: "REPL",
        iconPath: this.commentIconPath,
      },
      contextValue: `${this.extensionPrefix}CanDelete`,
      outputContent,
    };

    thread.comments = [comment];
  }

  private async renderWithPuppeteer(html: string): Promise<string> {
    const chromePath = this.configManager.get("chromeExecutable");
    if (chromePath && chromePath.trim() === "") {
      throw new Error("Chrome executable path is not set");
    }
    try {
      if (!this.browser) {
        const chromeArgs = [];
        if (process.platform === "linux") {
          chromeArgs.push("--no-sandbox");
        }
        this.browser = await puppeteer.launch({
          executablePath: chromePath,
          args: chromeArgs,
        });
      }

      const page = await this.browser.newPage();
      await page.setDefaultTimeout(5000);
      const wrappedHtml = `
          <!DOCTYPE html>
          <html>
              <head>
                  <style>
                      body { 
                          margin: 0; 
                          padding: 0; 
                          background: white;
                          display: flex;
                          justify-content: center;
                      }
                      .container { 
                          display: inline-block;
                          min-width: min-content;
                          max-width: 100%;
                          padding: 10px;
                      }
                      img, svg, canvas {
                          display: block;
                          max-width: 100%;
                          height: auto;
                      }
                  </style>
              </head>
              <body>
                  <div class="container">
                      ${html}
                  </div>
              </body>
          </html>
      `;

      await page.setContent(wrappedHtml, {
        waitUntil: ["networkidle0", "load", "domcontentloaded"],
      });

      await page.waitForFunction(() => {
        const el = document.querySelector(".container");
        return (
          el &&
          el.children.length > 0 &&
          Array.from(el.children).every(
            (child) => child.getBoundingClientRect().width > 0
          )
        );
      });

      const dimensions = await page.evaluate(() => {
        const container = document.querySelector(".container");
        if (!container) return null;

        const contentRect = Array.from(container.children).reduce(
          (acc, el) => {
            const childRect = el.getBoundingClientRect();
            return {
              left: Math.min(acc.left, childRect.left),
              top: Math.min(acc.top, childRect.top),
              right: Math.max(acc.right, childRect.right),
              bottom: Math.max(acc.bottom, childRect.bottom),
            };
          },
          { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
        );

        return {
          x: contentRect.left - 10,
          y: contentRect.top - 10,
          width: contentRect.right - contentRect.left + 20,
          height: contentRect.bottom - contentRect.top + 20,
        };
      });

      if (!dimensions) {
        throw new Error("Could not get content dimensions");
      }

      const screenshot = await page.screenshot({
        type: "png",
        encoding: "base64",
        clip: dimensions,
      });
      await page.close();
      return `data:image/png;base64,${screenshot}`;
    } catch (error) {
      throw error;
    }
  }
}
