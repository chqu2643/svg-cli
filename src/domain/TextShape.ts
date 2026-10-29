import { Shape } from "./Shape.js";
import type { ShapeAttributeValue } from "./ShapeDescription.js";
import type { ShapeStyle } from "./ShapeStyle.js";

export class TextShape extends Shape {
  public readonly type = "text" as const;

  private x: number;
  private y: number;
  private text: string;

  public constructor(
    id: string,
    x: number,
    y: number,
    text: string,
    style: ShapeStyle = {},
  ) {
    super(id, style);
    this.x = this.requireFinite("x", x);
    this.y = this.requireFinite("y", y);
    this.text = text;
  }

  public clone(): TextShape {
    return new TextShape(
      this.getId(),
      this.x,
      this.y,
      this.text,
      this.copyStyle(),
    );
  }

  protected geometryAttributes(): Record<string, ShapeAttributeValue> {
    return { text: this.text, x: this.x, y: this.y };
  }

  protected moveBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  protected scaleBy(factor: number): void {
    this.x *= factor;
    this.y *= factor;
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
    if (name === "text") {
      this.text = String(value);
      return true;
    }
    return false;
  }
}
