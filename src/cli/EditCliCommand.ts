import type { EditorSession, UndoableCommand } from "../application/index.js";

import type { CliCommand } from "./CliCommand.js";
import { ResultFormatter } from "./ResultFormatter.js";

export class EditCliCommand implements CliCommand {
  public constructor(
    private readonly session: EditorSession,
    private readonly command: UndoableCommand,
    private readonly formatter = new ResultFormatter(),
  ) {}

  public execute(): Promise<readonly string[]> {
    const result = this.session.executeEdit(this.command);
    return Promise.resolve([this.formatter.formatCommand(result)]);
  }
}
