import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  type CommandResult,
  CreateCommand,
  EditCommand,
  EditorSession,
  MoveCommand,
} from "../../src/application/index.js";
import { Rect, type SvgDocument } from "../../src/domain/index.js";

class MutateThenFailCommand extends EditCommand {
  protected performEdit(document: SvgDocument): CommandResult {
    document.addShape(new Rect("temporary", 0, 0, 1, 1));
    throw new Error("forced failure");
  }
}

const rect = (id: string) =>
  new CreateCommand({ height: 1, id, type: "rect", width: 1, x: 0, y: 0 });

describe("history and editor session", () => {
  it("requires a document before document-dependent operations", () => {
    const session = new EditorSession();

    expect(() => session.executeEdit(rect("a"))).toThrowError(
      "error: no document. use 'init' or 'read' first",
    );
    expect(() => session.undo()).toThrowError(ApplicationError);
  });

  it("locks history after document operations until a successful edit", () => {
    const session = new EditorSession();
    session.initializeDocument();

    expect(() => session.undo()).toThrowError(
      "error: undo not allowed after io command",
    );
    expect(() => session.executeEdit(new MoveCommand("missing", 1, 1))).toThrowError(
      "error: no such shape: missing",
    );
    expect(session.getHistory().isLockedAfterDocumentOperation()).toBe(true);

    session.executeEdit(rect("a"));
    expect(session.getHistory().isLockedAfterDocumentOperation()).toBe(false);
    session.undo();
    expect(session.requireDocument().getShape("a")).toBeUndefined();

    session.redo();
    session.markSaved();
    expect(session.getHistory().getUndoCount()).toBe(0);
    expect(() => session.redo()).toThrowError(
      "error: undo not allowed after io command",
    );
  });

  it("preserves redo after a failed edit and clears it after a new successful edit", () => {
    const session = new EditorSession();
    const document = session.initializeDocument();
    session.executeEdit(rect("a"));
    session.executeEdit(rect("b"));
    session.undo();
    expect(session.getHistory().getRedoCount()).toBe(1);

    expect(() => session.executeEdit(rect("a"))).toThrowError(
      "error: id already exists: a",
    );
    expect(session.getHistory().getRedoCount()).toBe(1);
    expect(document.getShape("b")).toBeUndefined();

    session.executeEdit(rect("c"));
    expect(session.getHistory().getRedoCount()).toBe(0);
    expect(() => session.redo()).toThrowError("error: nothing to redo");
  });

  it("rolls back partial mutation when an edit throws", () => {
    const session = new EditorSession();
    const document = session.initializeDocument();
    session.executeEdit(rect("stable"));
    const undoCount = session.getHistory().getUndoCount();

    expect(() => session.executeEdit(new MutateThenFailCommand())).toThrowError(
      "forced failure",
    );
    expect(document.getShape("temporary")).toBeUndefined();
    expect(document.getShape("stable")).toBeDefined();
    expect(session.getHistory().getUndoCount()).toBe(undoCount);
  });

  it("does not create a document-operation boundary when resize validation fails", () => {
    const session = new EditorSession();
    const document = session.initializeDocument(100, 80);
    session.executeEdit(rect("a"));

    expect(() => session.resizeCanvas(200, 0)).toThrowError(
      "error: invalid canvas height: 0",
    );
    expect(document.getCanvasSize()).toEqual({ height: 80, width: 100 });
    expect(session.getHistory().isLockedAfterDocumentOperation()).toBe(false);
    session.undo();
    expect(document.getShape("a")).toBeUndefined();
  });

  it("rejects re-executing a command instance", () => {
    const session = new EditorSession();
    session.initializeDocument();
    const command = rect("a");
    session.executeEdit(command);

    expect(() => session.executeEdit(command)).toThrowError(
      "error: edit command has already been executed",
    );
    expect(session.getHistory().getUndoCount()).toBe(1);
  });
});
