import { Readable, Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { Repl } from "../../src/cli/Repl.js";

class OutputBuffer extends Writable {
  private readonly chunks: Buffer[] = [];

  public override _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
    callback();
  }

  public override toString(): string {
    return Buffer.concat(this.chunks).toString("utf8");
  }
}

describe("Repl", () => {
  it("prints the banner and prompt", async () => {
    const output = new OutputBuffer();
    const repl = new Repl(Readable.from([]), output);

    await repl.run();

    expect(output.toString()).toBe(
      "svg-editor 0.1 — type 'help' for commands\n\nsvg> ",
    );
  });

  it("reports that command handling belongs to a later stage", async () => {
    const output = new OutputBuffer();
    const repl = new Repl(Readable.from(["help\n"]), output);

    await repl.run();

    expect(output.toString()).toContain(
      "error: command handling is not implemented yet\n",
    );
  });
});
