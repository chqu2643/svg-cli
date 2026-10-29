import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";

import type { CommandFactory } from "./CommandFactory.js";
import { Tokenizer } from "./Tokenizer.js";

type TerminalWritable = Writable & {
  readonly isTTY?: boolean;
};

const BANNER = "svg-editor 0.1 — type 'help' for commands";
const PROMPT = "svg> ";

export class Repl {
  public constructor(
    private readonly input: Readable,
    private readonly output: TerminalWritable,
    private readonly commandFactory: CommandFactory,
    private readonly tokenizer = new Tokenizer(),
  ) {}

  public async run(): Promise<void> {
    const reader = createInterface({
      input: this.input,
      output: this.output,
      terminal: Boolean(this.output.isTTY),
    });

    this.output.write(`${BANNER}\n\n`);
    let isClosed = false;
    reader.once("close", () => {
      isClosed = true;
    });
    reader.setPrompt(PROMPT);
    reader.prompt();

    for await (const line of reader) {
      await this.handleLine(line);
      if (!isClosed) {
        reader.prompt();
      } else {
        this.output.write(PROMPT);
      }
    }
  }

  private async handleLine(line: string): Promise<void> {
    try {
      const tokens = this.tokenizer.tokenize(line);
      if (tokens.length === 0) {
        return;
      }
      const lines = await this.commandFactory.create(tokens).execute();
      for (const outputLine of lines) {
        this.output.write(`${outputLine}\n`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.output.write(`${message.startsWith("error:") ? message : `error: ${message}`}\n`);
    }
  }
}
