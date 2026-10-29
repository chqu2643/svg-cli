import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class DeleteCommand extends EditCommand {
  public constructor(private readonly id: string) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    const shape = document.requireShape(this.id);
    const parentId = document.getParentId(this.id);
    document.deleteShape(this.id);
    const display = { subjectType: shape.type, verb: "deleted" };
    return {
      action: "delete",
      details: {
        ...(parentId === undefined ? {} : { parentId }),
        type: shape.type,
      },
      display,
      redoDisplay: display,
      targetId: this.id,
      undoDisplay: {
        subjectType: shape.type,
        suffix: ` into ${parentId === undefined ? "svg" : `g#${parentId}`}`,
        verb: "restored",
      },
    };
  }
}
