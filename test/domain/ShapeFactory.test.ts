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

  it("rejects unknown runtime types at the single type-dispatch boundary", () => {
    const factory = new ShapeFactory();
    const unknown = { id: "x1", type: "hexagon" } as unknown as ShapeCreationRequest;

    expect(() => factory.create(unknown)).toThrowError(DomainError);
    expect(() => factory.create(unknown)).toThrowError(
      "error: unknown shape type: hexagon (is the plugin loaded?)",
    );
  });
});
