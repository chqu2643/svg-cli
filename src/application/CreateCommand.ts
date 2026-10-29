import {
  ShapeFactory,
  type ShapeCreationRequest,
  type SvgDocument,
} from "../domain/index.js";

import type { CommandResult } from "./CommandResult.js";
import { EditCommand } from "./EditCommand.js";

export class CreateCommand extends EditCommand {
  public constructor(
    private readonly request: ShapeCreationRequest,
    private readonly parentId?: string,
    private readonly shapeFactory = new ShapeFactory(),
  ) {
    super();
  }

  protected performEdit(document: SvgDocument): CommandResult {
    const shape = this.shapeFactory.create(this.request);
    document.addShape(shape, this.parentId);
    return {
      action: "create",
      details: {
        ...(this.parentId === undefined ? {} : { parentId: this.parentId }),
        type: shape.type,
      },
      targetId: shape.getId(),
    };
  }
}
