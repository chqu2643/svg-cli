import { describe, expect, it } from "vitest";

import {
  CreateCommand,
  DocumentService,
  EditorSession,
  type SvgLoadResult,
  type SvgRepository,
} from "../../src/application/index.js";
import { Rect, SvgDocument } from "../../src/domain/index.js";

class FakeSvgRepository implements SvgRepository {
  public failLoad = false;
  public failSave = false;
  public loaded: SvgLoadResult = {
    document: new SvgDocument(320, 240),
    warnings: [],
  };
  public savedPath: string | undefined;

  public load(): Promise<SvgLoadResult> {
    if (this.failLoad) {
      return Promise.reject(new Error("load failed"));
    }
    return Promise.resolve(this.loaded);
  }

  public save(path: string): Promise<void> {
    if (this.failSave) {
      return Promise.reject(new Error("save failed"));
    }
    this.savedPath = path;
    return Promise.resolve();
  }
}

describe("DocumentService", () => {
  it("loads into a temporary result before replacing the session", async () => {
    const session = new EditorSession();
    session.initializeDocument(100, 80);
    const repository = new FakeSvgRepository();
    repository.loaded.document.addShape(new Rect("loaded", 1, 2, 3, 4));
    repository.loaded = {
      ...repository.loaded,
      warnings: ["warning: assigned id rect1 to unnamed <rect>"],
    };
    const service = new DocumentService(session, repository);

    await expect(service.read("input.svg")).resolves.toEqual({
      elementCount: 1,
      path: "input.svg",
      warnings: ["warning: assigned id rect1 to unnamed <rect>"],
    });
    expect(session.requireDocument().getCanvasSize()).toEqual({
      height: 240,
      width: 320,
    });
    expect(session.getCurrentPath()).toBe("input.svg");
    expect(() => session.undo()).toThrowError(
      "error: undo not allowed after io command",
    );
    await service.save();
    expect(repository.savedPath).toBe("input.svg");
    session.initializeDocument();
    expect(session.getCurrentPath()).toBeUndefined();
  });

  it("preserves document, path, and history when loading fails", async () => {
    const session = new EditorSession();
    const original = session.initializeDocument();
    session.executeEdit(
      new CreateCommand({ height: 1, id: "stable", type: "rect", width: 1, x: 0, y: 0 }),
    );
    const repository = new FakeSvgRepository();
    repository.failLoad = true;
    const service = new DocumentService(session, repository);

    await expect(service.read("bad.svg")).rejects.toThrow("load failed");
    expect(session.requireDocument()).toBe(original);
    expect(session.getCurrentPath()).toBeUndefined();
    expect(session.getHistory().getUndoCount()).toBe(1);
  });

  it("tracks a successful save path and reuses it", async () => {
    const session = new EditorSession();
    session.initializeDocument();
    const repository = new FakeSvgRepository();
    const service = new DocumentService(session, repository);

    await expect(service.save()).rejects.toThrow(
      "error: no save path. provide a file name",
    );
    await service.save("first.svg");
    expect(session.getCurrentPath()).toBe("first.svg");
    await service.save();
    expect(repository.savedPath).toBe("first.svg");
    expect(() => session.undo()).toThrowError(
      "error: undo not allowed after io command",
    );
  });

  it("does not commit a new path or history boundary when saving fails", async () => {
    const session = new EditorSession();
    session.initializeDocument();
    session.executeEdit(
      new CreateCommand({ height: 1, id: "a", type: "rect", width: 1, x: 0, y: 0 }),
    );
    const repository = new FakeSvgRepository();
    repository.failSave = true;
    const service = new DocumentService(session, repository);

    await expect(service.save("failed.svg")).rejects.toThrow("save failed");
    expect(session.getCurrentPath()).toBeUndefined();
    expect(session.getHistory().isLockedAfterDocumentOperation()).toBe(false);
    session.undo();
    expect(session.requireDocument().getShape("a")).toBeUndefined();
  });
});
