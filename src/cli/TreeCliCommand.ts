import type { EditorSession } from "../application/index.js";

import type { CliCommand } from "./CliCommand.js";
import { TreeFormatter } from "./TreeFormatter.js";

export class TreeCliCommand implements CliCommand {
  public constructor(
    private readonly session: EditorSession,
    private readonly id?: string,
    private readonly formatter = new TreeFormatter(),
  ) {}

  public execute(): Promise<readonly string[]> {
    return Promise.resolve([
      this.formatter.format(this.session.getTreeView(this.id), this.id === undefined),
    ]);
  }
}
