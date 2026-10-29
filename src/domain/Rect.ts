import { Shape } from "./Shape.js";
import type { ShapeAttributeValue } from "./ShapeDescription.js";
import type { ShapeStyle } from "./ShapeStyle.js";

export class Rect extends Shape {
  public readonly type = "rect" as const;

  private x: number;
  private y: number;
  private width: number;
  private height: number;

  public constructor(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    style: ShapeStyle = {},
  ) {
    super(id, style);
    this.x = this.requireFinite("x", x);
    this.y = this.requireFinite("y", y);
    this.width = this.requireNonNegative("width", width);
    this.height = this.requireNonNegative("height", height);
  }

  public clone(): Rect {
    return new Rect(
      this.getId(),
      this.x,
      this.y,
      this.width,
      this.height,
      this.copyStyle(),
    );
  }

  protected geometryAttributes(): Record<string, ShapeAttributeValue> {
    return { height: this.height, width: this.width, x: this.x, y: this.y };
  }

  protected moveBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  protected scaleBy(factor: number): void {
    this.x *= factor;
    this.y *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  protected setGeometryAttribute(name: string, value: ShapeAttributeValue): boolean {
    if (name === "x") {
      this.x = this.requireNumber(name, value);
      return true;
    }
    if (name === "y") {
      this.y = this.requireNumber(name, value);
      return true;
    }
    if (name === "width") {
      this.width = this.requireNonNegative(name, this.requireNumber(name, value));
      return true;
    }
    if (name === "height") {
      this.height = this.requireNonNegative(name, this.requireNumber(name, value));
      return true;
    }
    return false;
  }
}
