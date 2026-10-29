import { describe, expect, it } from "vitest";

import {
  AddToCommand,
  BackCommand,
  CreateCommand,
  DeleteCommand,
  EditorSession,
  FrontCommand,
  GroupCommand,
  MoveCommand,
  ScaleCommand,
  SetCommand,
  UngroupCommand,
} from "../../src/application/index.js";

describe("application edit commands", () => {
  it("executes all supported edit operations through the session", () => {
    const session = new EditorSession();
    const document = session.initializeDocument();
    session.executeEdit(new CreateCommand({ id: "host", type: "g" }));
    session.executeEdit(
      new CreateCommand({
        height: 4,
        id: "a",
        type: "rect",
        width: 3,
        x: 1,
        y: 2,
      }),
    );
    session.executeEdit(
      new CreateCommand({ cx: 5, cy: 6, id: "b", radius: 2, type: "circle" }),
    );

    session.executeEdit(new MoveCommand("a", 10, 20));
    session.executeEdit(new ScaleCommand("a", 2));
    session.executeEdit(new SetCommand("a", "fill", "#ff0000"));
    expect(document.requireShape("a").describe().attributes).toMatchObject({
      fill: "#ff0000",
      height: 8,
      width: 6,
      x: 22,
      y: 44,
    });

    session.executeEdit(new FrontCommand("host"));
    session.executeEdit(new BackCommand("b"));
    expect(document.getRootShapes().map((shape) => shape.getId())).toEqual([
      "b",
      "a",
      "host",
    ]);

    session.executeEdit(new AddToCommand("a", "host"));
    expect(document.getParentId("a")).toBe("host");
    session.executeEdit(new GroupCommand("nested", ["a"]));
    expect(document.getParentId("nested")).toBe("host");
    session.executeEdit(new UngroupCommand("nested"));
    expect(document.getParentId("a")).toBe("host");
    session.executeEdit(new DeleteCommand("b"));
    expect(document.getShape("b")).toBeUndefined();
  });

  it("treats a structural group edit as one undo and redo unit", () => {
    const session = new EditorSession();
    const document = session.initializeDocument();
    session.executeEdit(
      new CreateCommand({ height: 1, id: "a", type: "rect", width: 1, x: 0, y: 0 }),
    );
    session.executeEdit(
      new CreateCommand({ height: 1, id: "b", type: "rect", width: 1, x: 0, y: 0 }),
    );

    session.executeEdit(new GroupCommand("g1", ["a", "b"]));
    expect(session.getHistory().getUndoCount()).toBe(3);
    expect(document.getParentId("a")).toBe("g1");

    expect(session.undo()).toMatchObject({
      action: "undo",
      command: { action: "group", targetId: "g1" },
    });
    expect(document.getShape("g1")).toBeUndefined();
    expect(document.getRootShapes().map((shape) => shape.getId())).toEqual(["a", "b"]);

    session.redo();
    expect(document.getParentId("a")).toBe("g1");
    expect(document.getParentId("b")).toBe("g1");
  });
});
