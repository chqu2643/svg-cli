import type { ShapeAttributeValue, SvgDocument } from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class SetCommand extends EditCommand {
  public constructor(
    private readonly id: string,
    private readonly attribute: string,
    private readonly value: ShapeAttributeValue,
  ) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    const shape = document.requireShape(this.id);
    shape.setAttribute(this.attribute, this.value);
    return {
      action: "set",
      details: { attribute: this.attribute, type: shape.type, value: this.value },
      display: {
        subjectType: shape.type,
        suffix: `: ${this.attribute}=${this.formatValue(this.value)}`,
        verb: "updated",
      },
      targetId: this.id,
    };
  }

  private formatValue(value: ShapeAttributeValue): string {
    return typeof value === "string" && /\s/u.test(value)
      ? JSON.stringify(value)
      : String(value);
  }
}
