import {
  AddToCommand,
  BackCommand,
  CreateCommandBuilder,
  DeleteCommand,
  type DocumentOperationGateway,
  type EditorSession,
  FrontCommand,
  GroupCommand,
  MoveCommand,
  ScaleCommand,
  SetCommand,
  UngroupCommand,
} from "../application/index.js";

import { CanvasCliCommand } from "./CanvasCliCommand.js";
import { CliError } from "./CliError.js";
import type { CliCommand } from "./CliCommand.js";
import { EditCliCommand } from "./EditCliCommand.js";
import { HelpCliCommand } from "./HelpCliCommand.js";
import { InitCliCommand } from "./InitCliCommand.js";
import { ReadCliCommand } from "./ReadCliCommand.js";
import { RedoCliCommand } from "./RedoCliCommand.js";
import { SaveCliCommand } from "./SaveCliCommand.js";
import { ShowCliCommand } from "./ShowCliCommand.js";
import { TreeCliCommand } from "./TreeCliCommand.js";
import { UndoCliCommand } from "./UndoCliCommand.js";

export class CommandFactory {
  public constructor(
    private readonly session: EditorSession,
    private readonly documentGateway?: DocumentOperationGateway,
    private readonly createBuilder = new CreateCommandBuilder(),
  ) {}

  public create(tokens: readonly string[]): CliCommand {
    const name = tokens[0];
    if (name === undefined) {
      throw new CliError("error: empty command");
    }
    const args = tokens.slice(1);

    switch (name) {
      case "addto":
        this.requireCount(args, 2, 2, "addto <gid> <id>");
        return new EditCliCommand(
          this.session,
          new AddToCommand(this.requireArg(args, 1), this.requireArg(args, 0)),
        );
      case "back":
        return new EditCliCommand(
          this.session,
          new BackCommand(this.singleArg(args, "back <id>")),
        );
      case "canvas":
        return this.createCanvasCommand(args);
      case "create":
        return this.createShapeCommand(args);
      case "delete":
        return new EditCliCommand(
          this.session,
          new DeleteCommand(this.singleArg(args, "delete <id>")),
        );
      case "front":
        return new EditCliCommand(
          this.session,
          new FrontCommand(this.singleArg(args, "front <id>")),
        );
      case "group":
        this.requireCount(args, 2, Number.POSITIVE_INFINITY, "group <newGid> <id...>");
        return new EditCliCommand(
          this.session,
          new GroupCommand(this.requireArg(args, 0), args.slice(1)),
        );
      case "help":
        this.requireCount(args, 0, 0, "help");
        return new HelpCliCommand();
      case "init":
        return this.createInitCommand(args);
      case "move":
        this.requireCount(args, 3, 3, "move <id> <dx> <dy>");
        return new EditCliCommand(
          this.session,
          new MoveCommand(
            this.requireArg(args, 0),
            this.number(this.requireArg(args, 1), "dx"),
            this.number(this.requireArg(args, 2), "dy"),
          ),
        );
      case "read": {
        const path = this.singleArg(args, "read <file.svg>");
        return new ReadCliCommand(this.requireDocumentGateway(), path);
      }
      case "redo":
        this.requireCount(args, 0, 0, "redo");
        return new RedoCliCommand(this.session);
      case "save":
        this.requireCount(args, 0, 1, "save [file.svg]");
        return args[0] === undefined
          ? new SaveCliCommand(this.requireDocumentGateway())
          : new SaveCliCommand(this.requireDocumentGateway(), args[0]);
      case "scale":
        this.requireCount(args, 2, 2, "scale <id> <factor>");
        return new EditCliCommand(
          this.session,
          new ScaleCommand(
            this.requireArg(args, 0),
            this.number(this.requireArg(args, 1), "factor"),
          ),
        );
      case "set":
        this.requireCount(args, 3, 3, "set <id> <attr> <value>");
        return new EditCliCommand(
          this.session,
          new SetCommand(
            this.requireArg(args, 0),
            this.requireArg(args, 1),
            this.requireArg(args, 2),
          ),
        );
      case "show":
        return new ShowCliCommand(this.session, this.singleArg(args, "show <id>"));
      case "tree":
        this.requireCount(args, 0, 1, "tree [id]");
        return args[0] === undefined
          ? new TreeCliCommand(this.session)
          : new TreeCliCommand(this.session, args[0]);
      case "undo":
        this.requireCount(args, 0, 0, "undo");
        return new UndoCliCommand(this.session);
      case "ungroup":
        return new EditCliCommand(
          this.session,
          new UngroupCommand(this.singleArg(args, "ungroup <gid>")),
        );
      default:
        throw new CliError(`error: unknown command: ${name}`);
    }
  }

  private createCanvasCommand(args: readonly string[]): CanvasCliCommand {
    if (args.length === 0) {
      return new CanvasCliCommand(this.session);
    }
    this.requireCount(args, 2, 2, "canvas [w h]");
    return new CanvasCliCommand(this.session, {
      height: this.number(this.requireArg(args, 1), "height"),
      width: this.number(this.requireArg(args, 0), "width"),
    });
  }

  private createInitCommand(args: readonly string[]): InitCliCommand {
    if (args.length === 0) {
      return new InitCliCommand(this.session, 800, 600);
    }
    this.requireCount(args, 2, 2, "init [w h]");
    return new InitCliCommand(
      this.session,
      this.number(this.requireArg(args, 0), "width"),
      this.number(this.requireArg(args, 1), "height"),
    );
  }

  private createShapeCommand(args: readonly string[]): EditCliCommand {
    this.requireCount(args, 2, Number.POSITIVE_INFINITY, "create <type> <id> [params...] [in <gid>]");
    const type = this.requireArg(args, 0);
    const id = this.requireArg(args, 1);
    let parameters = args.slice(2);
    let parentId: string | undefined;
    if (parameters.length >= 2 && parameters.at(-2) === "in") {
      parentId = parameters.at(-1);
      parameters = parameters.slice(0, -2);
    }
    const command =
      parentId === undefined
        ? this.createBuilder.build(type, id, parameters)
        : this.createBuilder.build(type, id, parameters, parentId);
    return new EditCliCommand(this.session, command);
  }

  private number(value: string, name: string): number {
    const parsed = value.trim() === "" ? Number.NaN : Number(value);
    if (!Number.isFinite(parsed)) {
      throw new CliError(`error: invalid number for ${name}: ${value}`);
    }
    return parsed;
  }

  private requireArg(args: readonly string[], index: number): string {
    const value = args[index];
    if (value === undefined) {
      throw new Error(`Validated command argument ${String(index)} is missing`);
    }
    return value;
  }

  private requireCount(
    args: readonly string[],
    minimum: number,
    maximum: number,
    usage: string,
  ): void {
    if (args.length < minimum || args.length > maximum) {
      throw new CliError(`error: usage: ${usage}`);
    }
  }

  private requireDocumentGateway(): DocumentOperationGateway {
    if (this.documentGateway === undefined) {
      throw new CliError("error: SVG file support is not configured");
    }
    return this.documentGateway;
  }

  private singleArg(args: readonly string[], usage: string): string {
    this.requireCount(args, 1, 1, usage);
    return this.requireArg(args, 0);
  }
}
