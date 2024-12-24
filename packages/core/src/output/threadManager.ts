import { CommentThread, Range } from "vscode";

export class CommentThreadManager {
  private activeThreads: Map<string, CommentThread[]> = new Map();
  private deletedThreadRanges: Map<string, Range[]> = new Map();

  getThreads(docKey: string): CommentThread[] {
    return this.activeThreads.get(docKey) || [];
  }

  addThread(docKey: string, thread: CommentThread): void {
    const threads = this.getThreads(docKey);
    threads.push(thread);
    this.activeThreads.set(docKey, threads);
  }

  findThreadInRange(docKey: string, range: Range): CommentThread | undefined {
    const threads = this.getThreads(docKey);
    return threads.find(
      (thread) =>
        thread.range.start.line === range.start.line &&
        thread.range.end.line === range.end.line
    );
  }

  removeThread(docKey: string, thread: CommentThread): void {
    this.markThreadDeleted(docKey, thread.range);
    const threads = this.getThreads(docKey);
    const index = threads.indexOf(thread);
    if (index !== -1) {
      threads.splice(index, 1);
      if (threads.length === 0) {
        this.activeThreads.delete(docKey);
      } else {
        this.activeThreads.set(docKey, threads);
      }
    }
  }

  clearThreads(docKey: string): void {
    const threads = this.getThreads(docKey);
    threads.forEach((thread) => thread.dispose());
    this.activeThreads.delete(docKey);
  }

  isThreadDeleted(docKey: string, range: Range): boolean {
    const deletedRanges = this.deletedThreadRanges.get(docKey) || [];
    return deletedRanges.some(
      (r) => r.start.line === range.start.line && r.end.line === range.end.line
    );
  }

  markThreadDeleted(docKey: string, range: Range): void {
    const deletedRanges = this.deletedThreadRanges.get(docKey) || [];
    deletedRanges.push(range);
    this.deletedThreadRanges.set(docKey, deletedRanges);
  }

  dispose(): void {
    this.activeThreads.forEach((threads) => {
      threads.forEach((thread) => thread.dispose());
    });
    this.activeThreads.clear();
  }
}
