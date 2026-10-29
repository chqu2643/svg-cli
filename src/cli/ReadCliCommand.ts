import type { DocumentOperationGateway } from "../application/index.js";

import type { CliCommand } from "./CliCommand.js";

export class ReadCliCommand implements CliCommand {
  public constructor(
    private readonly gateway: DocumentOperationGateway,
    private readonly path: string,
  ) {}

  public async execute(): Promise<readonly string[]> {
    const result = await this.gateway.read(this.path);
    return [
      ...result.warnings,
      `read ${result.path} (${String(result.elementCount)} elements)`,
    ];
  }
}
