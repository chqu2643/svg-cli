import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class BackCommand extends EditCommand {
  public constructor(private readonly id: string) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    document.sendToBack(this.id);
    return { action: "back", targetId: this.id };
  }
}
