import { Circle } from "./Circle.js";
import { DomainError } from "./DomainError.js";
import { Ellipse } from "./Ellipse.js";
import { Group } from "./Group.js";
import { Line } from "./Line.js";
import { Rect } from "./Rect.js";
import type { Shape } from "./Shape.js";
import type { ShapeCreationRequest } from "./ShapeCreationRequest.js";
import { TextShape } from "./TextShape.js";

export class ShapeFactory {
  public create(request: ShapeCreationRequest): Shape {
    switch (request.type) {
      case "circle":
        return new Circle(
          request.id,
          request.cx,
          request.cy,
          request.radius,
          request.style,
        );
      case "ellipse":
        return new Ellipse(
          request.id,
          request.cx,
          request.cy,
          request.radiusX,
          request.radiusY,
          request.style,
        );
      case "g":
        return new Group(request.id, request.style);
      case "line":
        return new Line(
          request.id,
          request.x1,
          request.y1,
          request.x2,
          request.y2,
          request.style,
        );
      case "rect":
        return new Rect(
          request.id,
          request.x,
          request.y,
          request.width,
          request.height,
          request.style,
        );
      case "text":
        return new TextShape(
          request.id,
          request.x,
          request.y,
          request.text,
          request.style,
        );
      default: {
        const unknownRequest = request as { readonly type: string };
        throw new DomainError(
          "UNKNOWN_SHAPE_TYPE",
          `error: unknown shape type: ${unknownRequest.type} (is the plugin loaded?)`,
        );
      }
    }
  }
}
