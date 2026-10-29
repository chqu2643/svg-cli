export interface CliCommand {
  execute(): Promise<readonly string[]>;
}
