import { SvgDocument } from "../domain/index.js";

import { ApplicationError } from "./ApplicationError.js";
import type { CommandResult, HistoryResult } from "./CommandResult.js";
import { HistoryManager } from "./HistoryManager.js";
import type { UndoableCommand } from "./UndoableCommand.js";

export class EditorSession {
  private document: SvgDocument | undefined;

  public constructor(private readonly history = new HistoryManager()) {}

  public executeEdit(command: UndoableCommand): CommandResult {
    return this.history.execute(command, this.requireDocument());
  }

  public getDocument(): SvgDocument | undefined {
    return this.document;
  }

  public getHistory(): HistoryManager {
    return this.history;
  }

  public initializeDocument(width = 800, height = 600): SvgDocument {
    const document = new SvgDocument(width, height);
    this.document = document;
    this.history.markDocumentOperation();
    return document;
  }

  public markSaved(): void {
    this.requireDocument();
    this.history.markDocumentOperation();
  }

  public redo(): HistoryResult {
    return this.history.redo(this.requireDocument());
  }

  public replaceDocument(document: SvgDocument): void {
    this.document = document;
    this.history.markDocumentOperation();
  }

  public resizeCanvas(width: number, height: number): void {
    const document = this.requireDocument();
    document.setCanvasSize(width, height);
    this.history.markDocumentOperation();
  }

  public requireDocument(): SvgDocument {
    if (this.document === undefined) {
      throw new ApplicationError(
        "NO_DOCUMENT",
        "error: no document. use 'init' or 'read' first",
      );
    }
    return this.document;
  }

  public undo(): HistoryResult {
    return this.history.undo(this.requireDocument());
  }
}
