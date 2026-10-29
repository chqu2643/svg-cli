import type { SvgDocument } from "../domain/index.js";

import type { Command } from "./Command.js";
import type { CommandResult } from "./CommandResult.js";

export interface UndoableCommand extends Command<CommandResult> {
  redo(document: SvgDocument): CommandResult;
  undo(document: SvgDocument): CommandResult;
}
