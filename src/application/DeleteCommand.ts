import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class DeleteCommand extends EditCommand {
  public constructor(private readonly id: string) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    const shape = document.requireShape(this.id);
    document.deleteShape(this.id);
    return {
      action: "delete",
      details: { type: shape.type },
      display: { subjectType: shape.type, verb: "deleted" },
      targetId: this.id,
    };
  }
}
