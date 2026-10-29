import type { DocumentOperationGateway } from "../application/index.js";

import type { CliCommand } from "./CliCommand.js";

export class SaveCliCommand implements CliCommand {
  public constructor(
    private readonly gateway: DocumentOperationGateway,
    private readonly path?: string,
  ) {}

  public async execute(): Promise<readonly string[]> {
    const result = await this.gateway.save(this.path);
    return [`saved to ${result.path} (${String(result.elementCount)} elements)`];
  }
}
