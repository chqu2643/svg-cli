import type { CliCommand } from "./CliCommand.js";
import { HelpFormatter } from "./HelpFormatter.js";

export class HelpCliCommand implements CliCommand {
  public constructor(private readonly formatter = new HelpFormatter()) {}

  public execute(): Promise<readonly string[]> {
    return Promise.resolve([this.formatter.format()]);
  }
}
