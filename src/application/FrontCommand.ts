import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class FrontCommand extends EditCommand {
  public constructor(private readonly id: string) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    document.bringToFront(this.id);
    return { action: "front", targetId: this.id };
  }
}
