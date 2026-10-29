import type {
  CommandResult,
  HistoryResult,
} from "../application/index.js";

export class ResultFormatter {
  public formatCommand(result: CommandResult): string {
    return this.formatDisplay(result.targetId, result.display);
  }

  public formatHistory(result: HistoryResult): string {
    const display =
      result.action === "undo"
        ? result.command.undoDisplay
        : result.command.redoDisplay;
    if (display !== undefined) {
      return this.formatDisplay(result.command.targetId, display);
    }
    return `${result.action}: ${result.command.action} ${result.command.targetId}`;
  }

  private formatDisplay(
    targetId: string,
    display: CommandResult["display"],
  ): string {
    return `${display.subjectType}#${targetId} ${display.verb}${display.suffix ?? ""}`;
  }
}
