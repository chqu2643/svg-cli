import type {
  CommandResult,
  HistoryResult,
} from "../application/index.js";

export class ResultFormatter {
  public formatCommand(result: CommandResult): string {
    const display = result.display;
    return `${display.subjectType}#${result.targetId} ${display.verb}${display.suffix ?? ""}`;
  }

  public formatHistory(result: HistoryResult): string {
    return `${result.action}: ${result.command.action} ${result.command.targetId}`;
  }
}
