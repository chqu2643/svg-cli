import { describe, expect, it } from "vitest";

import { Circle, Group, Rect } from "../../src/domain/index.js";

describe("Group", () => {
  it("recursively moves and scales each descendant exactly once", () => {
    const rect = new Rect("r1", 1, 2, 3, 4);
    const circle = new Circle("c1", 5, 6, 7);
    const nested = new Group("nested", {}, [circle]);
    const root = new Group("root", {}, [rect, nested]);

    root.move(1, 2);
    root.scale(2);

    expect(rect.describe().attributes).toEqual({ height: 8, width: 6, x: 4, y: 8 });
    expect(circle.describe().attributes).toEqual({ cx: 12, cy: 16, r: 14 });
  });

  it("keeps group style separate from explicit child style", () => {
    const child = new Rect("r1", 0, 0, 10, 10, { fill: "red" });
    const group = new Group("g1", {}, [child]);

    group.setAttribute("fill", "blue");

    expect(group.describe().attributes).toEqual({ fill: "blue" });
    expect(child.describe().attributes.fill).toBe("red");
    expect(() => group.setAttribute("x", 10)).toThrowError(
      "error: unknown attribute: x",
    );
  });

  it("deep-clones its ordered subtree", () => {
    const group = new Group("g1", {}, [new Rect("r1", 0, 0, 10, 10)]);
    const clone = group.clone();

    clone.move(20, 30);

    expect(group.describe().children?.[0]?.attributes).toEqual({
      height: 10,
      width: 10,
      x: 0,
      y: 0,
    });
    expect(clone.describe().children?.[0]?.attributes).toEqual({
      height: 10,
      width: 10,
      x: 20,
      y: 30,
    });
  });

  it("does not expose its mutable child array", () => {
    const group = new Group("g1", {}, [new Rect("r1", 0, 0, 1, 1)]);
    const externalView = group.getChildren() as Rect[];

    externalView.splice(0, 1);

    expect(group.getChildren().map((shape) => shape.getId())).toEqual(["r1"]);
  });
});
