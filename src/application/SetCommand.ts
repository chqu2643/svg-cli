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
    document.requireShape(this.id).setAttribute(this.attribute, this.value);
    return {
      action: "set",
      details: { attribute: this.attribute, value: this.value },
      targetId: this.id,
    };
  }
}
