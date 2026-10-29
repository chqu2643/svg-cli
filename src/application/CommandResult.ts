export type EditAction =
  | "addto"
  | "back"
  | "create"
  | "delete"
  | "front"
  | "group"
  | "move"
  | "scale"
  | "set"
  | "ungroup";

export type CommandResultDetail = number | string | readonly string[];

export interface CommandResultDisplay {
  readonly subjectType: string;
  readonly suffix?: string;
  readonly verb: string;
}

export interface CommandResult {
  readonly action: EditAction;
  readonly details?: Readonly<Record<string, CommandResultDetail>>;
  readonly display: CommandResultDisplay;
  readonly redoDisplay?: CommandResultDisplay;
  readonly targetId: string;
  readonly undoDisplay?: CommandResultDisplay;
}

export interface HistoryResult {
  readonly action: "redo" | "undo";
  readonly command: CommandResult;
}
