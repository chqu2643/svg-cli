import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class UngroupCommand extends EditCommand {
  public constructor(private readonly id: string) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    document.ungroup(this.id);
    return {
      action: "ungroup",
      details: { type: "g" },
      display: { subjectType: "g", verb: "ungrouped" },
      targetId: this.id,
    };
  }
}
