import type { DocumentSnapshot, SvgDocument } from "../domain/index.js";

import { ApplicationError } from "./ApplicationError.js";
import type { CommandResult } from "./CommandResult.js";
import type { UndoableCommand } from "./UndoableCommand.js";

export abstract class EditCommand implements UndoableCommand {
  private before: DocumentSnapshot | undefined;
  private after: DocumentSnapshot | undefined;
  private result: CommandResult | undefined;

  public execute(document: SvgDocument): CommandResult {
    if (this.before !== undefined) {
      throw new ApplicationError(
        "COMMAND_ALREADY_EXECUTED",
        "error: edit command has already been executed",
      );
    }
    const before = document.createSnapshot();
    try {
      const result = this.performEdit(document);
      this.before = before;
      this.after = document.createSnapshot();
      this.result = result;
      return result;
    } catch (error: unknown) {
      document.restore(before);
      throw error;
    }
  }

  public redo(document: SvgDocument): CommandResult {
    document.restore(this.requireExecuted(this.after));
    return this.requireResult();
  }

  public undo(document: SvgDocument): CommandResult {
    document.restore(this.requireExecuted(this.before));
    return this.requireResult();
  }

  protected abstract performEdit(document: SvgDocument): CommandResult;

  private requireExecuted(snapshot: DocumentSnapshot | undefined): DocumentSnapshot {
    if (snapshot === undefined) {
      throw new ApplicationError(
        "COMMAND_NOT_EXECUTED",
        "error: edit command has not been executed",
      );
    }
    return snapshot;
  }

  private requireResult(): CommandResult {
    if (this.result === undefined) {
      throw new ApplicationError(
        "COMMAND_NOT_EXECUTED",
        "error: edit command has not been executed",
      );
    }
    return this.result;
  }
}
