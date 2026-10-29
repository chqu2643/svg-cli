import type { EditorSession } from "../application/index.js";

import type { CliCommand } from "./CliCommand.js";

export class InitCliCommand implements CliCommand {
  public constructor(
    private readonly session: EditorSession,
    private readonly width: number,
    private readonly height: number,
  ) {}

  public execute(): Promise<readonly string[]> {
    this.session.initializeDocument(this.width, this.height);
    return Promise.resolve([
      `canvas ${String(this.width)}x${String(this.height)} created`,
    ]);
  }
}
