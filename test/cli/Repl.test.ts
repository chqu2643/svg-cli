import { Readable, Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { EditorSession } from "../../src/application/index.js";
import { CommandFactory } from "../../src/cli/CommandFactory.js";
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
    const session = new EditorSession();
    const repl = new Repl(
      Readable.from([]),
      output,
      new CommandFactory(session),
    );

    await repl.run();

    expect(output.toString()).toBe(
      "svg-editor 0.1 — type 'help' for commands\n\nsvg> ",
    );
  });

  it("runs an editing transcript and keeps errors inside the loop", async () => {
    const output = new OutputBuffer();
    const session = new EditorSession();
    const input = [
      "# ignored comment\n",
      "init 800 600\n",
      "create g scene\n",
      "create rect box 10 20 100 50 #eeeeee in scene\n",
      'create text title 20 40 "My Diagram" in scene\n',
      "tree\n",
      "show title\n",
      "move box 5 -5\n",
      "undo\n",
      "redo\n",
      "unknown\n",
    ];
    const repl = new Repl(
      Readable.from(input),
      output,
      new CommandFactory(session),
    );

    await repl.run();

    const transcript = output.toString();
    expect(transcript).toContain("canvas 800x600 created\n");
    expect(transcript).toContain("g#scene created\n");
    expect(transcript).toContain("rect#box created in g#scene\n");
    expect(transcript).toContain("text#title created in g#scene\n");
    expect(transcript).toContain(
      "svg (800x600)\n└── g#scene\n    ├── rect#box  x=10 y=20 w=100 h=50 fill=#eeeeee\n    └── text#title  (20,40) \"My Diagram\"\n",
    );
    expect(transcript).toContain(
      "text#title  parent=g#scene\n  (20,40) \"My Diagram\"\n",
    );
    expect(transcript).toContain("rect#box moved to (15,15)\n");
    expect(transcript).toContain("rect#box moved back to (10,20)\n");
    expect(transcript).toContain("rect#box moved to (15,15)\n");
    expect(transcript).toContain("error: unknown command: unknown\n");
    expect(session.requireDocument().getShapeCount()).toBe(3);
  });
});
