import type { SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class ScaleCommand extends EditCommand {
  public constructor(
    private readonly id: string,
    private readonly factor: number,
  ) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    document.requireShape(this.id).scale(this.factor);
    return {
      action: "scale",
      details: { factor: this.factor },
      targetId: this.id,
    };
  }
}
