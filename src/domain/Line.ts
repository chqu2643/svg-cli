import { Shape } from "./Shape.js";
import type { ShapeAttributeValue } from "./ShapeDescription.js";
import type { ShapeStyle } from "./ShapeStyle.js";

export class Line extends Shape {
  public readonly type = "line" as const;

  private x1: number;
  private y1: number;
  private x2: number;
  private y2: number;

  public constructor(
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    style: ShapeStyle = {},
  ) {
    super(id, style);
    this.x1 = this.requireFinite("x1", x1);
    this.y1 = this.requireFinite("y1", y1);
    this.x2 = this.requireFinite("x2", x2);
    this.y2 = this.requireFinite("y2", y2);
  }

  public clone(): Line {
    return new Line(
      this.getId(),
      this.x1,
      this.y1,
      this.x2,
      this.y2,
      this.copyStyle(),
    );
  }

  protected geometryAttributes(): Record<string, ShapeAttributeValue> {
    return { x1: this.x1, x2: this.x2, y1: this.y1, y2: this.y2 };
  }

  protected moveBy(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  protected scaleBy(factor: number): void {
    this.x1 *= factor;
    this.y1 *= factor;
    this.x2 *= factor;
    this.y2 *= factor;
  }

  protected setGeometryAttribute(name: string, value: ShapeAttributeValue): boolean {
    if (name === "x1") {
      this.x1 = this.requireNumber(name, value);
      return true;
    }
    if (name === "y1") {
      this.y1 = this.requireNumber(name, value);
      return true;
    }
    if (name === "x2") {
      this.x2 = this.requireNumber(name, value);
      return true;
    }
    if (name === "y2") {
      this.y2 = this.requireNumber(name, value);
      return true;
    }
    return false;
  }
}
