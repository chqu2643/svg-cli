import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class BackCommand extends EditCommand {
  public constructor(private readonly id: string) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    const shape = document.requireShape(this.id);
    document.sendToBack(this.id);
    return {
      action: "back",
      details: { type: shape.type },
      display: { subjectType: shape.type, verb: "sent to back" },
      targetId: this.id,
    };
  }
}
