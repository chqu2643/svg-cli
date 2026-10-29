import { describe, expect, it } from "vitest";

import {
  Circle,
  DomainError,
  Group,
  Rect,
  SvgDocument,
} from "../../src/domain/index.js";

describe("SvgDocument", () => {
  it("indexes an ordered nested tree and tracks parent relationships", () => {
    const document = new SvgDocument();
    const group = new Group("g1", {}, [
      new Rect("r1", 0, 0, 10, 20),
      new Circle("c1", 5, 6, 2),
    ]);

    document.addShape(group);

    expect(document.getShapeCount()).toBe(3);
    expect(document.getRootShapes().map((shape) => shape.getId())).toEqual(["g1"]);
    expect(document.getParentId("g1")).toBeUndefined();
    expect(document.getParentId("r1")).toBe("g1");
    expect(document.getParentId("c1")).toBe("g1");
  });

  it("enforces globally unique, case-sensitive IDs atomically", () => {
    const document = new SvgDocument();
    document.addShape(new Rect("r1", 0, 0, 1, 1));
    document.addShape(new Rect("R1", 0, 0, 1, 1));
    const group = new Group("g1", {}, [new Circle("r1", 1, 1, 1)]);

    expect(() => document.addShape(group)).toThrowError(
      "error: id already exists: r1",
    );
    expect(document.getShapeCount()).toBe(2);
    expect(document.getShape("g1")).toBeUndefined();
  });

  it("validates the target container before changing the document", () => {
    const document = new SvgDocument();
    document.addShape(new Rect("r1", 0, 0, 1, 1));
    const before = document.getRootShapes().map((shape) => shape.getId());

    expect(() => document.addShape(new Circle("c1", 0, 0, 1), "missing")).toThrowError(
      "error: no such container: missing",
    );
    expect(() => document.addShape(new Circle("c2", 0, 0, 1), "r1")).toThrowError(
      "error: not a container: r1",
    );
    expect(document.getRootShapes().map((shape) => shape.getId())).toEqual(before);
    expect(document.getShapeCount()).toBe(1);
  });

  it("adds a new shape directly to an existing container", () => {
    const document = new SvgDocument();
    const group = new Group("g1");
    document.addShape(group);

    document.addShape(new Rect("r1", 1, 2, 3, 4), "g1");

    expect(group.getChildren().map((shape) => shape.getId())).toEqual(["r1"]);
    expect(document.getParentId("r1")).toBe("g1");
    expect(document.getShapeCount()).toBe(2);
  });

  it("deletes a complete subtree from the tree and ID index", () => {
    const document = new SvgDocument();
    const group = new Group("g1", {}, [
      new Rect("r1", 0, 0, 1, 1),
      new Circle("c1", 0, 0, 1),
    ]);
    document.addShape(group);

    document.deleteShape("g1");

    expect(document.getShapeCount()).toBe(0);
    expect(document.getRootShapes()).toEqual([]);
    expect(document.getShape("r1")).toBeUndefined();
    expect(document.getShape("c1")).toBeUndefined();
  });

  it("reparents shapes and prevents container cycles", () => {
    const document = new SvgDocument();
    const inner = new Group("inner", {}, [new Rect("r1", 0, 0, 1, 1)]);
    const outer = new Group("outer", {}, [inner]);
    document.addShape(outer);
    document.addShape(new Group("target"));

    document.moveShapeTo("inner", "target");

    expect(document.getParentId("inner")).toBe("target");
    expect(document.getParentId("r1")).toBe("inner");
    expect(() => document.moveShapeTo("target", "inner")).toThrowError(
      "error: cannot move a container into its own descendant: target",
    );
    expect(document.getParentId("target")).toBeUndefined();
  });

  it("changes z-order only among siblings", () => {
    const document = new SvgDocument();
    document.addShape(new Rect("a", 0, 0, 1, 1));
    document.addShape(new Rect("b", 0, 0, 1, 1));
    document.addShape(new Rect("c", 0, 0, 1, 1));

    document.bringToFront("a");
    expect(document.getRootShapes().map((shape) => shape.getId())).toEqual([
      "b",
      "c",
      "a",
    ]);

    document.sendToBack("c");
    expect(document.getRootShapes().map((shape) => shape.getId())).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("ungroups a nested group in place while preserving child order", () => {
    const document = new SvgDocument();
    const nested = new Group("nested", {}, [
      new Rect("r1", 0, 0, 1, 1),
      new Circle("c1", 0, 0, 1),
    ]);
    const parent = new Group("parent", {}, [
      new Rect("before", 0, 0, 1, 1),
      nested,
      new Rect("after", 0, 0, 1, 1),
    ]);
    document.addShape(parent);

    document.ungroup("nested");

    expect(parent.getChildren().map((shape) => shape.getId())).toEqual([
      "before",
      "r1",
      "c1",
      "after",
    ]);
    expect(document.getShape("nested")).toBeUndefined();
    expect(document.getParentId("r1")).toBe("parent");
    expect(document.getParentId("c1")).toBe("parent");
  });

  it("rejects ungrouping a top-level group without mutation", () => {
    const document = new SvgDocument();
    const group = new Group("g1", {}, [new Rect("r1", 0, 0, 1, 1)]);
    document.addShape(group);

    expect(() => document.ungroup("g1")).toThrowError(
      "error: cannot ungroup top-level container: g1",
    );
    expect(document.getShapeCount()).toBe(2);
    expect(document.getParentId("r1")).toBe("g1");
  });

  it("restores deep snapshots without sharing mutable nodes", () => {
    const document = new SvgDocument(100, 80);
    const group = new Group("g1", {}, [
      new Rect("r1", 1, 2, 3, 4, { fill: "red" }),
    ]);
    document.addShape(group);
    const snapshot = document.createSnapshot();

    document.requireShape("r1").move(10, 20);
    document.setCanvasSize(200, 160);
    document.addShape(new Circle("c1", 0, 0, 1));
    document.restore(snapshot);

    expect(document.getCanvasSize()).toEqual({ height: 80, width: 100 });
    expect(document.getShape("c1")).toBeUndefined();
    expect(document.requireShape("r1").describe().attributes).toEqual({
      fill: "red",
      height: 4,
      width: 3,
      x: 1,
      y: 2,
    });

    document.requireShape("r1").setAttribute("fill", "blue");
    document.restore(snapshot);
    expect(document.requireShape("r1").describe().attributes.fill).toBe("red");
  });

  it("validates both canvas dimensions before mutation", () => {
    const document = new SvgDocument(100, 80);

    expect(() => document.setCanvasSize(200, 0)).toThrowError(DomainError);
    expect(document.getCanvasSize()).toEqual({ height: 80, width: 100 });
  });
});
