import { SvgDocument } from "../domain/index.js";

import { ApplicationError } from "./ApplicationError.js";
import type { CommandResult, HistoryResult } from "./CommandResult.js";
import type { DocumentTreeView, ShapeView } from "./DocumentView.js";
import { HistoryManager } from "./HistoryManager.js";
import type { UndoableCommand } from "./UndoableCommand.js";

export class EditorSession {
  private document: SvgDocument | undefined;
  private currentPath: string | undefined;

  public constructor(private readonly history = new HistoryManager()) {}

  public executeEdit(command: UndoableCommand): CommandResult {
    return this.history.execute(command, this.requireDocument());
  }

  public getDocument(): SvgDocument | undefined {
    return this.document;
  }

  public getCurrentPath(): string | undefined {
    return this.currentPath;
  }

  public getHistory(): HistoryManager {
    return this.history;
  }

  public getShapeView(id: string): ShapeView {
    const document = this.requireDocument();
    const description = document.requireShape(id).describe();
    const parentId = document.getParentId(id);
    return {
      description,
      ...(parentId === undefined ? {} : { parentId }),
    };
  }

  public getTreeView(id?: string): DocumentTreeView {
    const document = this.requireDocument();
    const canvas = document.getCanvasSize();
    const roots =
      id === undefined
        ? document.getRootShapes().map((shape) => shape.describe())
        : [document.requireShape(id).describe()];
    return { ...canvas, roots };
  }

  public initializeDocument(width = 800, height = 600): SvgDocument {
    const document = new SvgDocument(width, height);
    this.document = document;
    this.currentPath = undefined;
    this.history.markDocumentOperation();
    return document;
  }

  public markSaved(path?: string): void {
    this.requireDocument();
    if (path !== undefined) {
      this.currentPath = path;
    }
    this.history.markDocumentOperation();
  }

  public redo(): HistoryResult {
    return this.history.redo(this.requireDocument());
  }

  public replaceDocument(document: SvgDocument, path?: string): void {
    this.document = document;
    this.currentPath = path;
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
