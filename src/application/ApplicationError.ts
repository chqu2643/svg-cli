export type ApplicationErrorCode =
  | "COMMAND_ALREADY_EXECUTED"
  | "COMMAND_NOT_EXECUTED"
  | "NO_DOCUMENT"
  | "NOTHING_TO_REDO"
  | "NOTHING_TO_UNDO"
  | "UNDO_NOT_ALLOWED_AFTER_IO";

export class ApplicationError extends Error {
  public constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
