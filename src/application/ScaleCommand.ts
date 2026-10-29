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
    const shape = document.requireShape(this.id);
    shape.scale(this.factor);
    return {
      action: "scale",
      details: { factor: this.factor, type: shape.type },
      display: {
        subjectType: shape.type,
        suffix: ` by ${String(this.factor)}`,
        verb: "scaled",
      },
      targetId: this.id,
    };
  }
}
