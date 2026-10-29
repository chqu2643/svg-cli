import { describe, expect, it } from "vitest";

import {
  Circle,
  DomainError,
  Ellipse,
  Line,
  Rect,
  TextShape,
} from "../../src/domain/index.js";

describe("concrete shapes", () => {
  it("moves, scales, and updates a rectangle through encapsulated behavior", () => {
    const rect = new Rect("r1", 10, 20, 30, 40, { fill: "red" });

    rect.move(5, -5);
    rect.scale(2);
    rect.setAttribute("width", "50");
    rect.setAttribute("stroke-width", "2.5");

    expect(rect.describe()).toEqual({
      attributes: {
        fill: "red",
        height: 80,
        "stroke-width": 2.5,
        width: 50,
        x: 30,
        y: 30,
      },
      id: "r1",
      type: "rect",
    });
  });

  it("applies circle geometry rules", () => {
    const circle = new Circle("c1", 10, 20, 5);

    circle.move(-2, 3);
    circle.scale(3);
    circle.setAttribute("r", 9);

    expect(circle.describe().attributes).toEqual({ cx: 24, cy: 69, r: 9 });
  });

  it("applies ellipse geometry rules", () => {
    const ellipse = new Ellipse("e1", 4, 5, 6, 7);

    ellipse.move(1, 2);
    ellipse.scale(2);
    ellipse.setAttribute("ry", "20");

    expect(ellipse.describe().attributes).toEqual({
      cx: 10,
      cy: 14,
      rx: 12,
      ry: 20,
    });
  });

  it("moves and scales both line endpoints", () => {
    const line = new Line("l1", 1, 2, 3, 4, { stroke: "black" });

    line.move(2, -1);
    line.scale(2);

    expect(line.describe().attributes).toEqual({
      stroke: "black",
      x1: 6,
      x2: 10,
      y1: 2,
      y2: 6,
    });
  });

  it("updates text position and content", () => {
    const text = new TextShape("t1", 10, 12, "before");

    text.move(5, 3);
    text.scale(2);
    text.setAttribute("text", "after");

    expect(text.describe().attributes).toEqual({ text: "after", x: 30, y: 30 });
  });

  it("rejects invalid operations without changing shape state", () => {
    const rect = new Rect("r1", 1, 2, 3, 4);
    const before = rect.describe();

    expect(() => rect.scale(0)).toThrowError("error: scale factor must be positive");
    expect(() => rect.setAttribute("radius", 10)).toThrowError(
      "error: unknown attribute: radius",
    );
    expect(() => rect.setAttribute("width", -1)).toThrowError(DomainError);
    expect(() => rect.setAttribute("x", " ")).toThrowError(DomainError);
    expect(rect.describe()).toEqual(before);
  });

  it("deep-clones mutable shape state", () => {
    const original = new Circle("c1", 10, 20, 5, { fill: "blue" });
    const clone = original.clone();

    clone.move(100, 100);
    clone.setAttribute("fill", "green");

    expect(original.describe().attributes).toEqual({
      cx: 10,
      cy: 20,
      fill: "blue",
      r: 5,
    });
  });
});
