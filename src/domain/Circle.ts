import { Shape } from "./Shape.js";
import type { ShapeAttributeValue } from "./ShapeDescription.js";
import type { ShapeStyle } from "./ShapeStyle.js";

export class Circle extends Shape {
  public readonly type = "circle" as const;

  private cx: number;
  private cy: number;
  private radius: number;

  public constructor(
    id: string,
    cx: number,
    cy: number,
    radius: number,
    style: ShapeStyle = {},
  ) {
    super(id, style);
    this.cx = this.requireFinite("cx", cx);
    this.cy = this.requireFinite("cy", cy);
    this.radius = this.requireNonNegative("r", radius);
  }

  public clone(): Circle {
    return new Circle(
      this.getId(),
      this.cx,
      this.cy,
      this.radius,
      this.copyStyle(),
    );
  }

  protected geometryAttributes(): Record<string, ShapeAttributeValue> {
    return { cx: this.cx, cy: this.cy, r: this.radius };
  }

  protected moveBy(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  protected scaleBy(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.radius *= factor;
  }

  protected setGeometryAttribute(name: string, value: ShapeAttributeValue): boolean {
    if (name === "cx") {
      this.cx = this.requireNumber(name, value);
      return true;
    }
    if (name === "cy") {
      this.cy = this.requireNumber(name, value);
      return true;
    }
    if (name === "r") {
      this.radius = this.requireNonNegative(name, this.requireNumber(name, value));
      return true;
    }
    return false;
  }
}
