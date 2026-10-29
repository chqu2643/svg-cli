import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class GroupCommand extends EditCommand {
  public constructor(
    private readonly groupId: string,
    private readonly shapeIds: readonly string[],
  ) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    document.groupShapes(this.groupId, this.shapeIds);
    return {
      action: "group",
      details: { shapeIds: [...this.shapeIds] },
      targetId: this.groupId,
    };
  }
}
