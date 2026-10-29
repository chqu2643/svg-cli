import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { Rect, SvgDocument } from "../../src/domain/index.js";
import { FileSvgRepository } from "../../src/infrastructure/index.js";

describe("FileSvgRepository", () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map((path) =>
        rm(path, { force: true, recursive: true }),
      ),
    );
  });

  it("atomically saves and loads an SVG file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "svg-cli-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "diagram.svg");
    const document = new SvgDocument(100, 80);
    document.addShape(new Rect("r1", 1, 2, 3, 4));
    const repository = new FileSvgRepository();

    await repository.save(path, document);
    const source = await readFile(path, "utf8");
    expect(source).toContain('<rect id="r1" x="1" y="2" width="3" height="4"/>');
    expect(await readdir(directory)).toEqual(["diagram.svg"]);

    document.addShape(new Rect("r2", 5, 6, 7, 8));
    await repository.save(path, document);
    expect(await readdir(directory)).toEqual(["diagram.svg"]);

    const loaded = await repository.load(path);
    expect(loaded.document.getCanvasSize()).toEqual({ height: 80, width: 100 });
    expect(loaded.document.requireShape("r1").describe()).toEqual(
      document.requireShape("r1").describe(),
    );
    expect(loaded.document.requireShape("r2").describe()).toEqual(
      document.requireShape("r2").describe(),
    );
  });

  it("maps file-system failures to stable errors", async () => {
    const directory = await mkdtemp(join(tmpdir(), "svg-cli-"));
    temporaryDirectories.push(directory);
    const repository = new FileSvgRepository();

    await expect(repository.load(join(directory, "missing.svg"))).rejects.toThrow(
      `error: cannot read file: ${join(directory, "missing.svg")}`,
    );
    await expect(
      repository.save(join(directory, "missing", "out.svg"), new SvgDocument()),
    ).rejects.toThrow(
      `error: cannot write file: ${join(directory, "missing", "out.svg")}`,
    );
    expect(await readdir(directory)).toEqual([]);
  });
});
