import type { ShapeDescription } from "../domain/index.js";

export interface DocumentTreeView {
  readonly height: number;
  readonly roots: readonly ShapeDescription[];
  readonly width: number;
}

export interface ShapeView {
  readonly description: ShapeDescription;
  readonly parentId?: string;
}
