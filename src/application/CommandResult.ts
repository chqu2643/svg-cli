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

export interface CommandResult {
  readonly action: EditAction;
  readonly details?: Readonly<Record<string, CommandResultDetail>>;
  readonly targetId: string;
}

export interface HistoryResult {
  readonly action: "redo" | "undo";
  readonly command: CommandResult;
}
