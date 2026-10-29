#!/usr/bin/env node

import { EditorSession } from "../application/index.js";
import { CommandFactory, Repl } from "../cli/index.js";

export class Main {
  public constructor(private readonly repl: Repl) {}

  public run(): Promise<void> {
    return this.repl.run();
  }
}

const session = new EditorSession();
const commandFactory = new CommandFactory(session);
const main = new Main(new Repl(process.stdin, process.stdout, commandFactory));

void main.run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`fatal: ${message}\n`);
  process.exitCode = 1;
});
