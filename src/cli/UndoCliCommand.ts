import type { EditorSession } from "../application/index.js";

import type { CliCommand } from "./CliCommand.js";
import { ResultFormatter } from "./ResultFormatter.js";

export class UndoCliCommand implements CliCommand {
  public constructor(
    private readonly session: EditorSession,
    private readonly formatter = new ResultFormatter(),
  ) {}

  public execute(): Promise<readonly string[]> {
    return Promise.resolve([this.formatter.formatHistory(this.session.undo())]);
  }
}
