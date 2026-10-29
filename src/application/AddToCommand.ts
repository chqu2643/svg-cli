import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class AddToCommand extends EditCommand {
  public constructor(
    private readonly id: string,
    private readonly containerId: string,
  ) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    document.moveShapeTo(this.id, this.containerId);
    return {
      action: "addto",
      details: { containerId: this.containerId },
      targetId: this.id,
    };
  }
}
