import { containerMutationAccess } from "./ContainerMutationAccess.js";
import { DocumentSnapshot } from "./DocumentSnapshot.js";
import { DomainError } from "./DomainError.js";
import { Group } from "./Group.js";
import type { Shape } from "./Shape.js";
import type { ShapeContainer } from "./ShapeContainer.js";

export interface CanvasSize {
  readonly height: number;
  readonly width: number;
}

export class SvgDocument {
  private width: number;
  private height: number;
  private rootShapes: Shape[] = [];
  private idIndex = new Map<string, Shape>();
  private parentById = new Map<string, string | null>();

  public constructor(width = 800, height = 600) {
    this.width = SvgDocument.requireCanvasDimension("width", width);
    this.height = SvgDocument.requireCanvasDimension("height", height);
  }

  public addShape(shape: Shape, parentId?: string): void {
    const parent = parentId === undefined ? undefined : this.requireContainer(parentId);
    const nodes = this.collectSubtree(shape);

    for (const node of nodes) {
      if (this.idIndex.has(node.getId())) {
        throw new DomainError(
          "DUPLICATE_ID",
          `error: id already exists: ${node.getId()}`,
        );
      }
    }

    this.insertInto(parent, parent?.getChildren().length ?? this.rootShapes.length, shape);
    this.registerSubtree(shape, parent?.getContainerId() ?? null);
  }

  public bringToFront(id: string): void {
    const shape = this.requireShape(id);
    const parentId = this.requireParentEntry(id);
    this.detachFromParent(shape, parentId);
    const parent = parentId === null ? undefined : this.requireContainer(parentId);
    this.insertInto(parent, parent?.getChildren().length ?? this.rootShapes.length, shape);
  }

  public createSnapshot(): DocumentSnapshot {
    return new DocumentSnapshot(this.width, this.height, this.rootShapes);
  }

  public deleteShape(id: string): void {
    const shape = this.requireShape(id);
    const parentId = this.requireParentEntry(id);
    this.detachFromParent(shape, parentId);
    this.unregisterSubtree(shape);
  }

  public getCanvasSize(): CanvasSize {
    return { height: this.height, width: this.width };
  }

  public getParentId(id: string): string | undefined {
    this.requireShape(id);
    const parentId = this.requireParentEntry(id);
    return parentId === null ? undefined : parentId;
  }

  public getRootShapes(): readonly Shape[] {
    return [...this.rootShapes];
  }

  public getShape(id: string): Shape | undefined {
    return this.idIndex.get(id);
  }

  public getShapeCount(): number {
    return this.idIndex.size;
  }

  public groupShapes(groupId: string, shapeIds: readonly string[]): Group {
    if (this.idIndex.has(groupId)) {
      throw new DomainError("DUPLICATE_ID", `error: id already exists: ${groupId}`);
    }
    if (shapeIds.length === 0) {
      throw new DomainError("EMPTY_GROUP", "error: group requires at least one shape");
    }

    const selectedIds = new Set<string>();
    const selectedShapes: Shape[] = [];
    for (const id of shapeIds) {
      if (selectedIds.has(id)) {
        throw new DomainError(
          "DUPLICATE_GROUP_MEMBER",
          `error: duplicate shape in group: ${id}`,
        );
      }
      selectedIds.add(id);
      selectedShapes.push(this.requireShape(id));
    }

    for (const shape of selectedShapes) {
      for (const otherId of selectedIds) {
        if (shape.getId() !== otherId && this.subtreeContains(shape, otherId)) {
          throw new DomainError(
            "CONTAINER_CYCLE",
            `error: cannot group a container into its own descendant: ${shape.getId()}`,
          );
        }
      }
    }

    const documentOrder = this.getDocumentOrder();
    const orderById = new Map(
      documentOrder.map((shape, index) => [shape.getId(), index] as const),
    );
    const orderedShapes = [...selectedShapes].sort(
      (left, right) =>
        (orderById.get(left.getId()) ?? Number.MAX_SAFE_INTEGER) -
        (orderById.get(right.getId()) ?? Number.MAX_SAFE_INTEGER),
    );

    const firstListed = selectedShapes[0];
    if (firstListed === undefined) {
      throw new Error("Validated group selection unexpectedly became empty");
    }
    const destinationParentId = this.requireParentEntry(firstListed.getId());
    const destinationSiblings = this.getSiblings(destinationParentId);
    const firstIndex = destinationSiblings.findIndex(
      (shape) => shape === firstListed,
    );
    if (firstIndex < 0) {
      throw new Error(`Document parent index is inconsistent for ${firstListed.getId()}`);
    }

    const sameParent = selectedShapes.every(
      (shape) => this.requireParentEntry(shape.getId()) === destinationParentId,
    );
    const insertionIndex = sameParent
      ? Math.min(
          ...selectedShapes.map((shape) => destinationSiblings.indexOf(shape)),
        )
      : firstIndex -
        destinationSiblings
          .slice(0, firstIndex)
          .filter((shape) => selectedIds.has(shape.getId())).length;

    const group = new Group(groupId, {}, orderedShapes);
    for (const shape of selectedShapes) {
      this.detachFromParent(shape, this.requireParentEntry(shape.getId()));
    }

    const destinationParent =
      destinationParentId === null
        ? undefined
        : this.requireContainer(destinationParentId);
    this.insertInto(destinationParent, insertionIndex, group);
    this.idIndex.set(groupId, group);
    this.parentById.set(groupId, destinationParentId);
    for (const shape of orderedShapes) {
      this.parentById.set(shape.getId(), groupId);
    }
    return group;
  }

  public moveShapeTo(id: string, containerId: string): void {
    const shape = this.requireShape(id);
    const target = this.requireContainer(containerId);

    if (id === containerId || this.subtreeContains(shape, containerId)) {
      throw new DomainError(
        "CONTAINER_CYCLE",
        `error: cannot move a container into its own descendant: ${id}`,
      );
    }

    const previousParentId = this.requireParentEntry(id);
    this.detachFromParent(shape, previousParentId);
    this.insertInto(target, target.getChildren().length, shape);
    this.parentById.set(id, containerId);
  }

  public requireShape(id: string): Shape {
    const shape = this.idIndex.get(id);
    if (shape === undefined) {
      throw new DomainError("SHAPE_NOT_FOUND", `error: no such shape: ${id}`);
    }
    return shape;
  }

  public restore(snapshot: DocumentSnapshot): void {
    const restored = new SvgDocument(snapshot.getWidth(), snapshot.getHeight());
    for (const shape of snapshot.copyRootShapes()) {
      restored.addShape(shape);
    }

    this.width = restored.width;
    this.height = restored.height;
    this.rootShapes = restored.rootShapes;
    this.idIndex = restored.idIndex;
    this.parentById = restored.parentById;
  }

  public sendToBack(id: string): void {
    const shape = this.requireShape(id);
    const parentId = this.requireParentEntry(id);
    this.detachFromParent(shape, parentId);
    const parent = parentId === null ? undefined : this.requireContainer(parentId);
    this.insertInto(parent, 0, shape);
  }

  public setCanvasSize(width: number, height: number): void {
    const nextWidth = SvgDocument.requireCanvasDimension("width", width);
    const nextHeight = SvgDocument.requireCanvasDimension("height", height);
    this.width = nextWidth;
    this.height = nextHeight;
  }

  public ungroup(id: string): void {
    const shape = this.requireShape(id);
    const group = shape.asContainer();
    if (group === undefined) {
      throw new DomainError("NOT_A_CONTAINER", `error: not a container: ${id}`);
    }
    if (!shape.canUngroup()) {
      throw new DomainError(
        "CANNOT_UNGROUP_COMPOSITE",
        `error: cannot ungroup composite shape: ${id}`,
      );
    }

    const parentId = this.requireParentEntry(id);
    if (parentId === null) {
      throw new DomainError(
        "CANNOT_UNGROUP_TOP_LEVEL",
        `error: cannot ungroup top-level container: ${id}`,
      );
    }

    const parent = this.requireContainer(parentId);
    const groupIndex = parent.indexOfChild(id);
    const children = group.getChildren();
    parent.removeChildAt(containerMutationAccess, groupIndex);

    for (let index = 0; index < children.length; index += 1) {
      group.removeChildAt(containerMutationAccess, 0);
      const child = children[index];
      if (child === undefined) {
        throw new Error("Group child disappeared during ungroup");
      }
      parent.insertChild(containerMutationAccess, groupIndex + index, child);
      this.parentById.set(child.getId(), parentId);
    }

    this.idIndex.delete(id);
    this.parentById.delete(id);
  }

  private static requireCanvasDimension(name: string, value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      throw new DomainError(
        "INVALID_CANVAS_SIZE",
        `error: invalid canvas ${name}: ${String(value)}`,
      );
    }
    return value;
  }

  private collectSubtree(root: Shape): readonly Shape[] {
    const nodes: Shape[] = [];
    const objects = new Set<Shape>();
    const ids = new Set<string>();

    const visit = (shape: Shape): void => {
      if (objects.has(shape)) {
        throw new DomainError(
          "CONTAINER_CYCLE",
          `error: container cycle detected: ${shape.getId()}`,
        );
      }
      if (ids.has(shape.getId())) {
        throw new DomainError(
          "DUPLICATE_ID",
          `error: id already exists: ${shape.getId()}`,
        );
      }

      objects.add(shape);
      ids.add(shape.getId());
      nodes.push(shape);
      const container = shape.asContainer();
      if (container !== undefined) {
        for (const child of container.getChildren()) {
          visit(child);
        }
      }
    };

    visit(root);
    return nodes;
  }

  private detachFromParent(shape: Shape, parentId: string | null): void {
    if (parentId === null) {
      const index = this.rootShapes.findIndex((candidate) => candidate === shape);
      if (index < 0) {
        throw new Error(`Document index is inconsistent for ${shape.getId()}`);
      }
      this.rootShapes.splice(index, 1);
      return;
    }

    const parent = this.requireContainer(parentId);
    const index = parent.indexOfChild(shape.getId());
    if (index < 0) {
      throw new Error(`Document parent index is inconsistent for ${shape.getId()}`);
    }
    parent.removeChildAt(containerMutationAccess, index);
  }

  private insertInto(
    parent: ShapeContainer | undefined,
    index: number,
    shape: Shape,
  ): void {
    if (parent === undefined) {
      this.rootShapes.splice(index, 0, shape);
      return;
    }
    parent.insertChild(containerMutationAccess, index, shape);
  }

  private getDocumentOrder(): readonly Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => {
      result.push(shape);
      const container = shape.asContainer();
      if (container !== undefined) {
        for (const child of container.getChildren()) {
          visit(child);
        }
      }
    };
    for (const shape of this.rootShapes) {
      visit(shape);
    }
    return result;
  }

  private getSiblings(parentId: string | null): readonly Shape[] {
    return parentId === null
      ? this.rootShapes
      : this.requireContainer(parentId).getChildren();
  }

  private registerSubtree(shape: Shape, parentId: string | null): void {
    this.idIndex.set(shape.getId(), shape);
    this.parentById.set(shape.getId(), parentId);
    const container = shape.asContainer();
    if (container !== undefined) {
      for (const child of container.getChildren()) {
        this.registerSubtree(child, shape.getId());
      }
    }
  }

  private requireContainer(id: string): ShapeContainer {
    const shape = this.idIndex.get(id);
    if (shape === undefined) {
      throw new DomainError("SHAPE_NOT_FOUND", `error: no such container: ${id}`);
    }
    const container = shape.asContainer();
    if (container === undefined) {
      throw new DomainError("NOT_A_CONTAINER", `error: not a container: ${id}`);
    }
    return container;
  }

  private requireParentEntry(id: string): string | null {
    const parentId = this.parentById.get(id);
    if (parentId === undefined) {
      throw new Error(`Document parent index is missing for ${id}`);
    }
    return parentId;
  }

  private subtreeContains(root: Shape, id: string): boolean {
    const container = root.asContainer();
    if (container === undefined) {
      return false;
    }
    for (const child of container.getChildren()) {
      if (child.getId() === id || this.subtreeContains(child, id)) {
        return true;
      }
    }
    return false;
  }

  private unregisterSubtree(shape: Shape): void {
    const container = shape.asContainer();
    if (container !== undefined) {
      for (const child of container.getChildren()) {
        this.unregisterSubtree(child);
      }
    }
    this.idIndex.delete(shape.getId());
    this.parentById.delete(shape.getId());
  }
}
