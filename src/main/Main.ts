#!/usr/bin/env node

import { DocumentService, EditorSession } from "../application/index.js";
import { CommandFactory, Repl } from "../cli/index.js";
import { FileSvgRepository } from "../infrastructure/index.js";

export class Main {
  public constructor(private readonly repl: Repl) {}

  public run(): Promise<void> {
    return this.repl.run();
  }
}

const session = new EditorSession();
const documentService = new DocumentService(session, new FileSvgRepository());
const commandFactory = new CommandFactory(session, documentService);
const main = new Main(new Repl(process.stdin, process.stdout, commandFactory));

void main.run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`fatal: ${message}\n`);
  process.exitCode = 1;
});
