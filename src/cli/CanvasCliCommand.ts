import type { EditorSession } from "../application/index.js";

import type { CliCommand } from "./CliCommand.js";

export class CanvasCliCommand implements CliCommand {
  public constructor(
    private readonly session: EditorSession,
    private readonly size?: { readonly height: number; readonly width: number },
  ) {}

  public execute(): Promise<readonly string[]> {
    if (this.size !== undefined) {
      this.session.resizeCanvas(this.size.width, this.size.height);
      return Promise.resolve([
        `canvas resized to ${String(this.size.width)}x${String(this.size.height)}`,
      ]);
    }
    const canvas = this.session.getTreeView();
    return Promise.resolve([`canvas ${String(canvas.width)}x${String(canvas.height)}`]);
  }
}
