import type { EditorSession } from "../application/index.js";

import type { CliCommand } from "./CliCommand.js";
import { ShowFormatter } from "./ShowFormatter.js";

export class ShowCliCommand implements CliCommand {
  public constructor(
    private readonly session: EditorSession,
    private readonly id: string,
    private readonly formatter = new ShowFormatter(),
  ) {}

  public execute(): Promise<readonly string[]> {
    return Promise.resolve([this.formatter.format(this.session.getShapeView(this.id))]);
  }
}
