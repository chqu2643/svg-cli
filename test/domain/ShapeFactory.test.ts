import { describe, expect, it } from "vitest";

import {
  DomainError,
  ShapeFactory,
  type ShapeCreationRequest,
} from "../../src/domain/index.js";

describe("ShapeFactory", () => {
  it("constructs all six built-in shape types", () => {
    const factory = new ShapeFactory();
    const requests: readonly ShapeCreationRequest[] = [
      { height: 4, id: "r1", type: "rect", width: 3, x: 1, y: 2 },
      { cx: 1, cy: 2, id: "c1", radius: 3, type: "circle" },
      { cx: 1, cy: 2, id: "e1", radiusX: 3, radiusY: 4, type: "ellipse" },
      { id: "l1", type: "line", x1: 1, x2: 3, y1: 2, y2: 4 },
      { id: "t1", text: "hello", type: "text", x: 1, y: 2 },
      { id: "g1", type: "g" },
    ];

    expect(requests.map((request) => factory.create(request).type)).toEqual([
      "rect",
      "circle",
      "ellipse",
      "line",
      "text",
      "g",
    ]);
  });

  it("builds typed creation requests from positional command values", () => {
    const factory = new ShapeFactory();

    expect(factory.createRequest("rect", "r1", ["1", "2", "3", "4", "red"]))
      .toEqual({
        height: 4,
        id: "r1",
        style: { fill: "red" },
        type: "rect",
        width: 3,
        x: 1,
        y: 2,
      });
    expect(factory.createRequest("text", "t1", ["5", "6", "hello world"]))
      .toEqual({ id: "t1", text: "hello world", type: "text", x: 5, y: 6 });
  });

  it("validates positional creation values and usage", () => {
    const factory = new ShapeFactory();

    expect(() => factory.createRequest("circle", "c1", ["x", "2", "3"]))
      .toThrowError("error: invalid number for cx: x");
    expect(() => factory.createRequest("g", "g1", ["extra"]))
      .toThrowError("error: usage: create g <id>");
  });

  it("rejects unknown runtime types at the single type-dispatch boundary", () => {
    const factory = new ShapeFactory();
    const unknown = { id: "x1", type: "hexagon" } as unknown as ShapeCreationRequest;

    expect(() => factory.create(unknown)).toThrowError(DomainError);
    expect(() => factory.create(unknown)).toThrowError(
      "error: unknown shape type: hexagon (is the plugin loaded?)",
    );
  });
});
