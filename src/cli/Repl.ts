import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";

type TerminalWritable = Writable & {
  readonly isTTY?: boolean;
};

const BANNER = "svg-editor 0.1 — type 'help' for commands";
const PROMPT = "svg> ";
const NOT_IMPLEMENTED = "error: command handling is not implemented yet";

export class Repl {
  public constructor(
    private readonly input: Readable,
    private readonly output: TerminalWritable,
  ) {}

  public run(): Promise<void> {
    const reader = createInterface({
      input: this.input,
      output: this.output,
      terminal: Boolean(this.output.isTTY),
    });

    this.output.write(`${BANNER}\n\n`);
    reader.setPrompt(PROMPT);
    reader.prompt();

    reader.on("line", (line) => {
      if (line.trim().length > 0) {
        this.output.write(`${NOT_IMPLEMENTED}\n`);
      }
      reader.prompt();
    });

    return new Promise((resolve) => {
      reader.once("close", resolve);
    });
  }
}
