import type { SvgDocument } from "../domain/index.js";

export interface SvgLoadResult {
  readonly document: SvgDocument;
  readonly warnings: readonly string[];
}

export interface SvgRepository {
  load(path: string): Promise<SvgLoadResult>;
  save(path: string, document: SvgDocument): Promise<void>;
}
