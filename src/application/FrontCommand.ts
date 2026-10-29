import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class FrontCommand extends EditCommand {
  public constructor(private readonly id: string) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    const shape = document.requireShape(this.id);
    document.bringToFront(this.id);
    return {
      action: "front",
      details: { type: shape.type },
      display: { subjectType: shape.type, verb: "brought to front" },
      targetId: this.id,
    };
  }
}
