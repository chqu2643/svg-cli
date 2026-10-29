import { describe, expect, it } from "vitest";

import {
  type DocumentOperationGateway,
  EditorSession,
} from "../../src/application/index.js";
import { CommandFactory } from "../../src/cli/CommandFactory.js";
import { Tokenizer } from "../../src/cli/Tokenizer.js";

class FakeDocumentGateway implements DocumentOperationGateway {
  public async read(path: string) {
    return {
      elementCount: 3,
      path,
      warnings: ["warning: assigned id rect1 to unnamed <rect>"],
    };
  }

  public async save(path?: string) {
    return { elementCount: 2, path: path ?? "current.svg" };
  }
}

describe("CommandFactory", () => {
  const tokenizer = new Tokenizer();

  it("parses every built-in create shape without another CLI type dispatch", async () => {
    const session = new EditorSession();
    const factory = new CommandFactory(session);
    await factory.create(tokenizer.tokenize("init")).execute();

    const commands = [
      "create rect r 1 2 3 4 red",
      "create circle c 1 2 3 blue",
      "create ellipse e 1 2 3 4 green",
      "create line l 1 2 3 4 black",
      'create text t 1 2 "hello world"',
      "create g group",
    ];
    for (const command of commands) {
      await factory.create(tokenizer.tokenize(command)).execute();
    }

    expect(session.requireDocument().getShapeCount()).toBe(6);
    expect(session.getShapeView("t").description.attributes.text).toBe(
      "hello world",
    );

    const editCommands = [
      "addto group r",
      "move r 2 3",
      "scale r 2",
      "set r fill orange",
      "front r",
      "back r",
      "group nested r",
      "ungroup nested",
      "delete e",
      "undo",
      "redo",
    ];
    for (const command of editCommands) {
      await factory.create(tokenizer.tokenize(command)).execute();
    }

    expect(session.requireDocument().getParentId("r")).toBe("group");
    expect(session.requireDocument().getShape("e")).toBeUndefined();
    await expect(factory.create(["canvas"]).execute()).resolves.toEqual([
      "canvas 800x600",
    ]);
    await expect(factory.create(["help"]).execute()).resolves.toHaveLength(1);
  });

  it("parses document gateway commands and formats their results", async () => {
    const factory = new CommandFactory(
      new EditorSession(),
      new FakeDocumentGateway(),
    );

    await expect(factory.create(["read", "input.svg"]).execute()).resolves.toEqual([
      "warning: assigned id rect1 to unnamed <rect>",
      "read input.svg (3 elements)",
    ]);
    await expect(factory.create(["save"]).execute()).resolves.toEqual([
      "saved to current.svg (2 elements)",
    ]);
    await expect(factory.create(["save", "out.svg"]).execute()).resolves.toEqual([
      "saved to out.svg (2 elements)",
    ]);
  });

  it("reports syntax, number, type, and missing-storage errors", () => {
    const factory = new CommandFactory(new EditorSession());

    expect(() => factory.create(["move", "a", "x", "2"])).toThrowError(
      "error: invalid number for dx: x",
    );
    expect(() => factory.create(["delete"])).toThrowError(
      "error: usage: delete <id>",
    );
    expect(() => factory.create(["create", "box", "b1"])).toThrowError(
      "error: unknown shape type: box (is the plugin loaded?)",
    );
    expect(() => factory.create(["read", "a.svg"])).toThrowError(
      "error: SVG file support is not configured",
    );
    expect(() => factory.create(["read"])).toThrowError(
      "error: usage: read <file.svg>",
    );
  });
});
