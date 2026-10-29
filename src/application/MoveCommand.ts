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
    const shape = document.requireShape(this.id);
    const before = shape.describe().attributes;
    shape.move(this.dx, this.dy);
    const after = shape.describe().attributes;
    const display = this.positionDisplay(shape.type, after, "moved", false);
    return {
      action: "move",
      details: { dx: this.dx, dy: this.dy, type: shape.type },
      display,
      redoDisplay: display,
      targetId: this.id,
      undoDisplay: this.positionDisplay(shape.type, before, "moved back", true),
    };
  }

  private positionDisplay(
    type: string,
    attributes: Readonly<Record<string, number | string>>,
    verb: string,
    reverseDelta: boolean,
  ) {
    const x = attributes.cx ?? attributes.x;
    const y = attributes.cy ?? attributes.y;
    if (x !== undefined && y !== undefined) {
      return {
        subjectType: type,
        suffix: ` to (${String(x)},${String(y)})`,
        verb,
      };
    }
    const dx = reverseDelta ? -this.dx : this.dx;
    const dy = reverseDelta ? -this.dy : this.dy;
    return {
      subjectType: type,
      suffix: ` by (${String(dx)},${String(dy)})`,
      verb,
    };
  }
}
