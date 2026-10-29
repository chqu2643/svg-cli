import { Shape } from "./Shape.js";
import type { ShapeAttributeValue } from "./ShapeDescription.js";
import type { ShapeStyle } from "./ShapeStyle.js";

export class Ellipse extends Shape {
  public readonly type = "ellipse" as const;

  private cx: number;
  private cy: number;
  private radiusX: number;
  private radiusY: number;

  public constructor(
    id: string,
    cx: number,
    cy: number,
    radiusX: number,
    radiusY: number,
    style: ShapeStyle = {},
  ) {
    super(id, style);
    this.cx = this.requireFinite("cx", cx);
    this.cy = this.requireFinite("cy", cy);
    this.radiusX = this.requireNonNegative("rx", radiusX);
    this.radiusY = this.requireNonNegative("ry", radiusY);
  }

  public clone(): Ellipse {
    return new Ellipse(
      this.getId(),
      this.cx,
      this.cy,
      this.radiusX,
      this.radiusY,
      this.copyStyle(),
    );
  }

  protected geometryAttributes(): Record<string, ShapeAttributeValue> {
    return { cx: this.cx, cy: this.cy, rx: this.radiusX, ry: this.radiusY };
  }

  protected moveBy(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  protected scaleBy(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.radiusX *= factor;
    this.radiusY *= factor;
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
    if (name === "rx") {
      this.radiusX = this.requireNonNegative(name, this.requireNumber(name, value));
      return true;
    }
    if (name === "ry") {
      this.radiusY = this.requireNonNegative(name, this.requireNumber(name, value));
      return true;
    }
    return false;
  }
}
