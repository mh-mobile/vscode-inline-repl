import { TextEditor, Range } from "vscode";
import { findCellBoundary, isCellBoundary } from "./parser";
import { Context } from "../context";

export class CodeReader {
  readCode(editor: TextEditor): string | null {
    const range = this.getExecutionRange(editor);
    if (!range) {
      return null;
    }

    return editor.document.getText(range).trim();
  }

  getExecutionRange(editor: TextEditor): Range {
    const selection = editor.selection;

    if (!selection.isEmpty) {
      return selection;
    }

    const cursorLine = selection.active.line;
    const startLine = this.findStartLine(editor, cursorLine);

    if (startLine === -1) {
      return editor.document.lineAt(cursorLine).range;
    }

    const endLine = this.findEndLine(editor, cursorLine);

    return new Range(
      startLine,
      0,
      endLine,
      editor.document.lineAt(endLine).text.length
    );
  }

  private findStartLine(editor: TextEditor, cursorLine: number): number {
    return findCellBoundary(
      editor.document,
      cursorLine,
      -1,
      Context.current.core.cell_separator
    );
  }

  private findEndLine(editor: TextEditor, cursorLine: number): number {
    let nextLine = cursorLine;

    if (
      isCellBoundary(
        editor.document.lineAt(nextLine).text.trim(),
        Context.current.core.cell_separator
      )
    ) {
      nextLine = cursorLine + 1;
    }

    let endLine = findCellBoundary(
      editor.document,
      nextLine,
      1,
      Context.current.core.cell_separator
    );
    return endLine === -1 ? editor.document.lineCount - 1 : endLine;
  }
}
