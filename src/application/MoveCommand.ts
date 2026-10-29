import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class MoveCommand extends EditCommand {
  public constructor(
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    document.requireShape(this.id).move(this.dx, this.dy);
    return {
      action: "move",
      details: { dx: this.dx, dy: this.dy },
      targetId: this.id,
    };
  }
}
