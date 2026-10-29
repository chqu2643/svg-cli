import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Writable } from "node:stream";

import { afterEach, describe, expect, it } from "vitest";

import { DocumentService, EditorSession } from "../../src/application/index.js";
import { CommandFactory, Repl } from "../../src/cli/index.js";
import { FileSvgRepository, SvgCodec } from "../../src/infrastructure/index.js";

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

describe("complete CLI workflows", () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map((path) =>
        rm(path, { force: true, recursive: true }),
      ),
    );
  });

  it("runs the complete editing transcript with real save and read operations", async () => {
    const directory = await createTemporaryDirectory();
    const demoPath = join(directory, "demo.svg");
    const otherPath = join(directory, "other.svg");
    await writeFile(
      otherPath,
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">',
        '  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>',
        '  <text id="t1" x="10" y="290">imported</text>',
        '  <circle id="c1" cx="50" cy="50" r="10"/>',
        '  <g id="g1">',
        '    <rect id="r2" x="0" y="0" width="10" height="10"/>',
        '    <circle id="c2" cx="5" cy="5" r="2"/>',
        "  </g>",
        '  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>',
        "</svg>",
      ].join("\n"),
      "utf8",
    );

    const { output } = await runCli([
      "init 800 600",
      "create rect bg 0 0 800 600 #ffffff",
      'create text title 20 40 "My Diagram"',
      "create circle c1 100 100 20 red",
      "create rect box 200 80 60 60 #3366ff",
      "group markers c1 box",
      "tree",
      "move c1 30 0",
      "undo",
      "redo",
      'set title text "My Diagram v2"',
      "undo",
      "group bad c1 markers",
      "delete box",
      "undo",
      `save "${cliPath(demoPath)}"`,
      "undo",
      `read "${cliPath(otherPath)}"`,
      "tree",
    ]);

    expect(output).toContain("g#markers created with 2 children\n");
    expect(output).toContain(
      "svg (800x600)\n" +
        "├── rect#bg  x=0 y=0 w=800 h=600 fill=#ffffff\n" +
        '├── text#title  (20,40) "My Diagram"\n' +
        "└── g#markers\n" +
        "    ├── circle#c1  cx=100 cy=100 r=20 fill=red\n" +
        "    └── rect#box  x=200 y=80 w=60 h=60 fill=#3366ff\n",
    );
    expect(output).toContain("circle#c1 moved to (130,100)\n");
    expect(output).toContain("circle#c1 moved back to (100,100)\n");
    expect(output).toContain('text#title updated: text="My Diagram"\n');
    expect(output).toContain(
      "error: cannot group a container into its own descendant: markers\n",
    );
    expect(output).toContain("rect#box restored into g#markers\n");
    expect(output).toContain(`saved to ${cliPath(demoPath)} (5 elements)\n`);
    expect(output).toContain("error: undo not allowed after io command\n");
    expect(output).toContain("warning: assigned id rect1 to unnamed <rect>\n");
    expect(output).toContain(`read ${cliPath(otherPath)} (7 elements)\n`);
    expect(output).toContain(
      "svg (400x300)\n" +
        "├── rect#rect1  x=0 y=0 w=400 h=300 fill=#ffffff\n" +
        '├── text#t1  (10,290) "imported"\n' +
        "├── circle#c1  cx=50 cy=50 r=10\n" +
        "├── g#g1\n" +
        "│   ├── rect#r2  x=0 y=0 w=10 h=10\n" +
        "│   └── circle#c2  cx=5 cy=5 r=2\n" +
        "└── ellipse#e1  cx=1 cy=2 rx=3 ry=4\n",
    );

    const saved = new SvgCodec().decode(await readFile(demoPath, "utf8")).document;
    expect(saved.getShapeCount()).toBe(5);
    expect(saved.requireShape("c1").describe().attributes).toMatchObject({
      cx: 130,
      cy: 100,
    });
    expect(saved.requireShape("title").describe().attributes.text).toBe("My Diagram");
    expect(saved.getParentId("box")).toBe("markers");
  });

  it("builds, edits, undoes, and saves the nested two-node flowchart", async () => {
    const directory = await createTemporaryDirectory();
    const outputPath = join(directory, "flowchart.svg");
    const { output } = await runCli([
      "init 800 600",
      "create g flowchart",
      "create g node1 in flowchart",
      "create rect start 120 100 160 60 #4a90d9 in node1",
      'create text start-label 155 135 "开始" in node1',
      "create g node2 in flowchart",
      "create rect process 520 100 160 60 #f5a623 in node2",
      'create text process-label 545 135 "处理数据" in node2',
      "create line arrow1 280 130 520 130 black in flowchart",
      "tree",
      "move node2 0 100",
      "undo",
      'set process-label text "处理数据 v2"',
      `save "${cliPath(outputPath)}"`,
    ]);

    expect(output).toContain(
      "svg (800x600)\n" +
        "└── g#flowchart\n" +
        "    ├── g#node1\n" +
        "    │   ├── rect#start  x=120 y=100 w=160 h=60 fill=#4a90d9\n" +
        '    │   └── text#start-label  (155,135) "开始"\n' +
        "    ├── g#node2\n" +
        "    │   ├── rect#process  x=520 y=100 w=160 h=60 fill=#f5a623\n" +
        '    │   └── text#process-label  (545,135) "处理数据"\n' +
        "    └── line#arrow1  (280,130) -> (520,130) stroke=black\n",
    );
    expect(output).toContain("g#node2 moved by (0,100)\n");
    expect(output).toContain("g#node2 moved back by (0,-100)\n");
    expect(output).toContain(
      'text#process-label updated: text="处理数据 v2"\n',
    );
    expect(output).toContain(`saved to ${cliPath(outputPath)} (8 elements)\n`);

    const source = await readFile(outputPath, "utf8");
    const decoded = new SvgCodec().decode(source).document;
    expect(decoded.getShapeCount()).toBe(8);
    expect(decoded.getParentId("start")).toBe("node1");
    expect(decoded.getParentId("process-label")).toBe("node2");
    expect(decoded.requireShape("process").describe().attributes).toMatchObject({
      x: 520,
      y: 100,
    });
    expect(decoded.requireShape("process-label").describe().attributes.text).toBe(
      "处理数据 v2",
    );
  });

  async function createTemporaryDirectory(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), "svg-cli-e2e-"));
    temporaryDirectories.push(directory);
    return directory;
  }
});

function cliPath(path: string): string {
  return path.replaceAll("\\", "/");
}

async function runCli(
  commands: readonly string[],
): Promise<{ readonly output: string; readonly session: EditorSession }> {
  const session = new EditorSession();
  const output = new OutputBuffer();
  const service = new DocumentService(session, new FileSvgRepository());
  const repl = new Repl(
    Readable.from(commands.map((command) => `${command}\n`)),
    output,
    new CommandFactory(session, service),
  );
  await repl.run();
  return { output: output.toString(), session };
}
