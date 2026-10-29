import type { SvgDocument } from "../domain/index.js";

export interface Command<TResult> {
  execute(document: SvgDocument): TResult;
}
