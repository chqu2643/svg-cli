import type { SvgDocument } from "../domain/index.js";

import { ApplicationError } from "./ApplicationError.js";
import type { CommandResult, HistoryResult } from "./CommandResult.js";
import type { UndoableCommand } from "./UndoableCommand.js";

export class HistoryManager {
  private readonly undoStack: UndoableCommand[] = [];
  private readonly redoStack: UndoableCommand[] = [];
  private documentOperationLock = false;

  public execute(command: UndoableCommand, document: SvgDocument): CommandResult {
    const result = command.execute(document);
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.documentOperationLock = false;
    return result;
  }

  public getRedoCount(): number {
    return this.redoStack.length;
  }

  public getUndoCount(): number {
    return this.undoStack.length;
  }

  public isLockedAfterDocumentOperation(): boolean {
    return this.documentOperationLock;
  }

  public markDocumentOperation(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.documentOperationLock = true;
  }

  public redo(document: SvgDocument): HistoryResult {
    this.assertHistoryAllowed();
    const command = this.redoStack.at(-1);
    if (command === undefined) {
      throw new ApplicationError("NOTHING_TO_REDO", "error: nothing to redo");
    }
    const result = command.redo(document);
    this.redoStack.pop();
    this.undoStack.push(command);
    return { action: "redo", command: result };
  }

  public undo(document: SvgDocument): HistoryResult {
    this.assertHistoryAllowed();
    const command = this.undoStack.at(-1);
    if (command === undefined) {
      throw new ApplicationError("NOTHING_TO_UNDO", "error: nothing to undo");
    }
    const result = command.undo(document);
    this.undoStack.pop();
    this.redoStack.push(command);
    return { action: "undo", command: result };
  }

  private assertHistoryAllowed(): void {
    if (this.documentOperationLock) {
      throw new ApplicationError(
        "UNDO_NOT_ALLOWED_AFTER_IO",
        "error: undo not allowed after io command",
      );
    }
  }
}
