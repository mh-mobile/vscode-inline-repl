import { TextDocument } from "vscode";

export function isCellBoundary(text: string, cell_separator: string): boolean {
  return text.trim() === cell_separator;
}

export function findCellBoundary(
  document: TextDocument,
  line: number,
  direction: -1 | 1,
  cell_separator: string
): number {
  while (line >= 0 && line < document.lineCount) {
    const text = document.lineAt(line).text.trim();
    if (text.startsWith(cell_separator)) {
      return line;
    }
    line += direction;
  }
  return -1;
}
