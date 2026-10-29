import {
  containerMutationAccess,
  type ContainerMutationAccess,
} from "./ContainerMutationAccess.js";
import { DomainError } from "./DomainError.js";
import { Shape } from "./Shape.js";
import type { ShapeContainer } from "./ShapeContainer.js";
import type {
  ShapeAttributeValue,
  ShapeDescription,
} from "./ShapeDescription.js";
import type { ShapeStyle } from "./ShapeStyle.js";

export class Group extends Shape implements ShapeContainer {
  public readonly type = "g" as const;

  private readonly children: Shape[] = [];

  public constructor(
    id: string,
    style: ShapeStyle = {},
    children: readonly Shape[] = [],
  ) {
    super(id, style);
    for (const child of children) {
      this.insertChild(containerMutationAccess, this.children.length, child);
    }
  }

  public override asContainer(): ShapeContainer {
    return this;
  }

  public clone(): Group {
    return new Group(
      this.getId(),
      this.copyStyle(),
      this.children.map((child) => child.clone()),
    );
  }

  public override canUngroup(): boolean {
    return true;
  }

  public override describe(): ShapeDescription {
    return {
      ...super.describe(),
      children: this.children.map((child) => child.describe()),
    };
  }

  public getChildren(): readonly Shape[] {
    return [...this.children];
  }

  public getContainerId(): string {
    return this.getId();
  }

  public indexOfChild(id: string): number {
    return this.children.findIndex((child) => child.getId() === id);
  }

  public insertChild(
    access: ContainerMutationAccess,
    index: number,
    child: Shape,
  ): void {
    this.requireMutationAccess(access);
    if (!Number.isInteger(index) || index < 0 || index > this.children.length) {
      throw new RangeError(`Child index out of range: ${String(index)}`);
    }
    if (this.indexOfChild(child.getId()) >= 0) {
      throw new DomainError(
        "DUPLICATE_ID",
        `error: id already exists: ${child.getId()}`,
      );
    }
    this.children.splice(index, 0, child);
  }

  public removeChildAt(access: ContainerMutationAccess, index: number): Shape {
    this.requireMutationAccess(access);
    const child = this.children[index];
    if (child === undefined) {
      throw new RangeError(`Child index out of range: ${String(index)}`);
    }
    this.children.splice(index, 1);
    return child;
  }

  protected geometryAttributes(): Record<string, ShapeAttributeValue> {
    return {};
  }

  protected moveBy(dx: number, dy: number): void {
    for (const child of this.children) {
      child.move(dx, dy);
    }
  }

  protected scaleBy(factor: number): void {
    for (const child of this.children) {
      child.scale(factor);
    }
  }

  protected setGeometryAttribute(): boolean {
    return false;
  }

  private requireMutationAccess(access: ContainerMutationAccess): void {
    if (access !== containerMutationAccess) {
      throw new Error("Container mutation must be coordinated by SvgDocument");
    }
  }
}
