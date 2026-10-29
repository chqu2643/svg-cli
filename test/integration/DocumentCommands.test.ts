import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  DocumentService,
  EditorSession,
} from "../../src/application/index.js";
import { CommandFactory } from "../../src/cli/index.js";
import { FileSvgRepository } from "../../src/infrastructure/index.js";

describe("read/save command integration", () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map((path) =>
        rm(path, { force: true, recursive: true }),
      ),
    );
  });

  it("reads, edits, and saves through the complete command boundary", async () => {
    const directory = await mkdtemp(join(tmpdir(), "svg-cli-integration-"));
    temporaryDirectories.push(directory);
    const input = join(directory, "input.svg");
    const output = join(directory, "output.svg");
    await writeFile(
      input,
      '<svg width="200" height="100"><rect x="1" y="2" width="3" height="4" fill="red"/></svg>',
      "utf8",
    );

    const session = new EditorSession();
    const service = new DocumentService(session, new FileSvgRepository());
    const factory = new CommandFactory(session, service);

    await expect(factory.create(["read", input]).execute()).resolves.toEqual([
      "warning: assigned id rect1 to unnamed <rect>",
      `read ${input} (1 elements)`,
    ]);
    await expect(factory.create(["move", "rect1", "10", "20"]).execute())
      .resolves.toEqual(["rect#rect1 moved by (10,20)"]);
    await expect(factory.create(["save", output]).execute()).resolves.toEqual([
      `saved to ${output} (1 elements)`,
    ]);
    expect(await readFile(output, "utf8")).toContain(
      '<rect id="rect1" x="11" y="22" width="3" height="4" fill="red"/>',
    );
    expect(() => session.undo()).toThrowError(
      "error: undo not allowed after io command",
    );
  });
});
