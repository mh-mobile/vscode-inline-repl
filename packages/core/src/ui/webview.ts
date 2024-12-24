import { WebviewPanel, window, ViewColumn } from "vscode";

export class WebviewManager {
  private outputPanels: WebviewPanel[] = [];

  openInBuffer(content: string, isHtml: boolean): void {
    const activeEditor = window.activeTextEditor;
    const panel = window.createWebviewPanel(
      "replOutput",
      "REPL Output",
      {
        viewColumn: ViewColumn.Beside,
        preserveFocus: true,
      },
      {
        enableScripts: false,
        retainContextWhenHidden: true,
      }
    );

    panel.onDidDispose(() => {
      this.outputPanels = this.outputPanels.filter((p) => p !== panel);
      if (activeEditor) {
        window.showTextDocument(activeEditor.document, activeEditor.viewColumn);
      }
    });

    this.outputPanels.push(panel);

    panel.webview.html = this.getWebviewContent(content, isHtml);
  }

  private getWebviewContent(content: string, isHtml: boolean = false): string {
    const bodyContent = isHtml
      ? content
      : `<pre>${this.escapeHtml(content)}</pre>`;
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          padding: 0 20px;
          line-height: 1.5;
          font-family: var(--vscode-editor-font-family);
          font-size: var(--vscode-editor-font-size);
          color: var(--vscode-editor-foreground);
          background-color: var(--vscode-editor-background);
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          background-color: var(--vscode-textBlockQuote-background);
          padding: 16px;
          border-radius: 4px;
          margin: 16px 0;
        }
      </style>
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>`;
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  dispose(): void {
    this.outputPanels.forEach((panel) => panel.dispose());
    this.outputPanels = [];
  }
}
