import { ShapeFactory } from "../domain/index.js";

import { CreateCommand } from "./CreateCommand.js";

export class CreateCommandBuilder {
  public constructor(private readonly shapeFactory = new ShapeFactory()) {}

  public build(
    type: string,
    id: string,
    parameters: readonly string[],
    parentId?: string,
  ): CreateCommand {
    const request = this.shapeFactory.createRequest(type, id, parameters);
    return new CreateCommand(request, parentId, this.shapeFactory);
  }
}
