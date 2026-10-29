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

  public createRequest(
    type: string,
    id: string,
    parameters: readonly string[],
  ): ShapeCreationRequest {
    switch (type) {
      case "circle": {
        this.requireParameterCount(type, parameters, 3, 4, "<cx> <cy> <r> [fill]");
        return {
          cx: this.requireNumber("cx", parameters[0]),
          cy: this.requireNumber("cy", parameters[1]),
          id,
          radius: this.requireNumber("r", parameters[2]),
          ...(parameters[3] === undefined ? {} : { style: { fill: parameters[3] } }),
          type,
        };
      }
      case "ellipse": {
        this.requireParameterCount(
          type,
          parameters,
          4,
          5,
          "<cx> <cy> <rx> <ry> [fill]",
        );
        return {
          cx: this.requireNumber("cx", parameters[0]),
          cy: this.requireNumber("cy", parameters[1]),
          id,
          radiusX: this.requireNumber("rx", parameters[2]),
          radiusY: this.requireNumber("ry", parameters[3]),
          ...(parameters[4] === undefined ? {} : { style: { fill: parameters[4] } }),
          type,
        };
      }
      case "g":
        this.requireParameterCount(type, parameters, 0, 0, "");
        return { id, type };
      case "line": {
        this.requireParameterCount(
          type,
          parameters,
          4,
          5,
          "<x1> <y1> <x2> <y2> [stroke]",
        );
        return {
          id,
          ...(parameters[4] === undefined
            ? {}
            : { style: { stroke: parameters[4] } }),
          type,
          x1: this.requireNumber("x1", parameters[0]),
          x2: this.requireNumber("x2", parameters[2]),
          y1: this.requireNumber("y1", parameters[1]),
          y2: this.requireNumber("y2", parameters[3]),
        };
      }
      case "rect": {
        this.requireParameterCount(
          type,
          parameters,
          4,
          5,
          "<x> <y> <w> <h> [fill]",
        );
        return {
          height: this.requireNumber("height", parameters[3]),
          id,
          ...(parameters[4] === undefined ? {} : { style: { fill: parameters[4] } }),
          type,
          width: this.requireNumber("width", parameters[2]),
          x: this.requireNumber("x", parameters[0]),
          y: this.requireNumber("y", parameters[1]),
        };
      }
      case "text":
        this.requireParameterCount(type, parameters, 3, 3, '<x> <y> "content"');
        return {
          id,
          text: parameters[2] ?? "",
          type,
          x: this.requireNumber("x", parameters[0]),
          y: this.requireNumber("y", parameters[1]),
        };
      default:
        throw new DomainError(
          "UNKNOWN_SHAPE_TYPE",
          `error: unknown shape type: ${type} (is the plugin loaded?)`,
        );
    }
  }

  public createRequestFromAttributes(
    type: string,
    id: string,
    attributes: Readonly<Record<string, string>>,
    text = "",
  ): ShapeCreationRequest {
    switch (type) {
      case "circle":
        this.requireOnlySvgAttributes(type, attributes, ["cx", "cy", "r"]);
        return this.createRequest(type, id, [
          this.requireSvgAttribute(type, attributes, "cx"),
          this.requireSvgAttribute(type, attributes, "cy"),
          this.requireSvgAttribute(type, attributes, "r"),
        ]);
      case "ellipse":
        this.requireOnlySvgAttributes(type, attributes, ["cx", "cy", "rx", "ry"]);
        return this.createRequest(type, id, [
          this.requireSvgAttribute(type, attributes, "cx"),
          this.requireSvgAttribute(type, attributes, "cy"),
          this.requireSvgAttribute(type, attributes, "rx"),
          this.requireSvgAttribute(type, attributes, "ry"),
        ]);
      case "g":
        this.requireOnlySvgAttributes(type, attributes, []);
        return this.createRequest(type, id, []);
      case "line":
        this.requireOnlySvgAttributes(type, attributes, ["x1", "y1", "x2", "y2"]);
        return this.createRequest(type, id, [
          this.requireSvgAttribute(type, attributes, "x1"),
          this.requireSvgAttribute(type, attributes, "y1"),
          this.requireSvgAttribute(type, attributes, "x2"),
          this.requireSvgAttribute(type, attributes, "y2"),
        ]);
      case "rect":
        this.requireOnlySvgAttributes(type, attributes, [
          "x",
          "y",
          "width",
          "height",
        ]);
        return this.createRequest(type, id, [
          this.requireSvgAttribute(type, attributes, "x"),
          this.requireSvgAttribute(type, attributes, "y"),
          this.requireSvgAttribute(type, attributes, "width"),
          this.requireSvgAttribute(type, attributes, "height"),
        ]);
      case "text":
        this.requireOnlySvgAttributes(type, attributes, ["x", "y"]);
        return this.createRequest(type, id, [
          this.requireSvgAttribute(type, attributes, "x"),
          this.requireSvgAttribute(type, attributes, "y"),
          text,
        ]);
      default:
        throw new DomainError(
          "UNKNOWN_SHAPE_TYPE",
          `error: unknown shape type: ${type} (is the plugin loaded?)`,
        );
    }
  }

  private requireNumber(name: string, value: string | undefined): number {
    const number = value === undefined || value.trim() === "" ? Number.NaN : Number(value);
    if (!Number.isFinite(number)) {
      throw new DomainError(
        "INVALID_CREATE_ARGUMENTS",
        `error: invalid number for ${name}: ${String(value)}`,
      );
    }
    return number;
  }

  private requireOnlySvgAttributes(
    type: string,
    attributes: Readonly<Record<string, string>>,
    geometryAttributes: readonly string[],
  ): void {
    const commonAttributes = new Set([
      "fill",
      "id",
      "stroke",
      "stroke-width",
      "transform",
    ]);
    for (const name of Object.keys(attributes)) {
      if (!commonAttributes.has(name) && !geometryAttributes.includes(name)) {
        throw new DomainError(
          "UNKNOWN_ATTRIBUTE",
          `error: unsupported SVG attribute: ${name} on <${type}>`,
        );
      }
    }
  }

  private requireSvgAttribute(
    type: string,
    attributes: Readonly<Record<string, string>>,
    name: string,
  ): string {
    const value = attributes[name];
    if (value === undefined) {
      throw new DomainError(
        "INVALID_CREATE_ARGUMENTS",
        `error: missing SVG attribute: ${name} on <${type}>`,
      );
    }
    return value;
  }

  private requireParameterCount(
    type: string,
    parameters: readonly string[],
    minimum: number,
    maximum: number,
    syntax: string,
  ): void {
    if (parameters.length < minimum || parameters.length > maximum) {
      const suffix = syntax.length === 0 ? "" : ` ${syntax}`;
      throw new DomainError(
        "INVALID_CREATE_ARGUMENTS",
        `error: usage: create ${type} <id>${suffix}`,
      );
    }
  }
}
