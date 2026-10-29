import type { Shape } from "./Shape.js";
import type { ContainerMutationAccess } from "./ContainerMutationAccess.js";

export interface ShapeContainer {
  getChildren(): readonly Shape[];
  getContainerId(): string;
  indexOfChild(id: string): number;
  insertChild(access: ContainerMutationAccess, index: number, child: Shape): void;
  removeChildAt(access: ContainerMutationAccess, index: number): Shape;
}
