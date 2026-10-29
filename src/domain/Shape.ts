import { DomainError } from "./DomainError.js";
import type { ShapeContainer } from "./ShapeContainer.js";
import type {
  ShapeAttributeValue,
  ShapeDescription,
  ShapeType,
} from "./ShapeDescription.js";
import type { ShapeStyle } from "./ShapeStyle.js";

export abstract class Shape {
  private readonly id: string;
  private fill: string | undefined;
  private stroke: string | undefined;
  private strokeWidth: number | undefined;

  protected constructor(id: string, style: ShapeStyle = {}) {
    const trimmedId = id.trim();
    if (trimmedId.length === 0 || trimmedId !== id) {
      throw new DomainError("INVALID_ID", `error: invalid shape id: ${id}`);
    }

    this.id = id;
    if (style.fill !== undefined) {
      this.fill = this.requireText("fill", style.fill);
    }
    if (style.stroke !== undefined) {
      this.stroke = this.requireText("stroke", style.stroke);
    }
    if (style.strokeWidth !== undefined) {
      this.strokeWidth = this.requireNonNegative("stroke-width", style.strokeWidth);
    }
  }

  public abstract readonly type: ShapeType;

  public abstract clone(): Shape;

  public asContainer(): ShapeContainer | undefined {
    return undefined;
  }

  public canUngroup(): boolean {
    return false;
  }

  public describe(): ShapeDescription {
    return {
      attributes: {
        ...this.geometryAttributes(),
        ...this.styleAttributes(),
      },
      id: this.id,
      type: this.type,
    };
  }

  public getId(): string {
    return this.id;
  }

  public move(dx: number, dy: number): void {
    this.moveBy(this.requireFinite("dx", dx), this.requireFinite("dy", dy));
  }

  public scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new DomainError(
        "INVALID_SCALE_FACTOR",
        "error: scale factor must be positive",
      );
    }
    this.scaleBy(factor);
  }

  public setAttribute(name: string, value: ShapeAttributeValue): void {
    if (this.setCommonAttribute(name, value) || this.setGeometryAttribute(name, value)) {
      return;
    }
    throw new DomainError("UNKNOWN_ATTRIBUTE", `error: unknown attribute: ${name}`);
  }

  protected abstract geometryAttributes(): Record<string, ShapeAttributeValue>;

  protected abstract moveBy(dx: number, dy: number): void;

  protected abstract scaleBy(factor: number): void;

  protected abstract setGeometryAttribute(
    name: string,
    value: ShapeAttributeValue,
  ): boolean;

  protected copyStyle(): ShapeStyle {
    return {
      ...(this.fill === undefined ? {} : { fill: this.fill }),
      ...(this.stroke === undefined ? {} : { stroke: this.stroke }),
      ...(this.strokeWidth === undefined ? {} : { strokeWidth: this.strokeWidth }),
    };
  }

  protected requireFinite(name: string, value: number): number {
    if (!Number.isFinite(value)) {
      throw new DomainError(
        "INVALID_ATTRIBUTE_VALUE",
        `error: invalid value for ${name}: ${String(value)}`,
      );
    }
    return value;
  }

  protected requireNonNegative(name: string, value: number): number {
    const number = this.requireFinite(name, value);
    if (number < 0) {
      throw new DomainError(
        "INVALID_ATTRIBUTE_VALUE",
        `error: invalid value for ${name}: ${String(value)}`,
      );
    }
    return number;
  }

  protected requireNumber(name: string, value: ShapeAttributeValue): number {
    if (typeof value === "string" && value.trim().length === 0) {
      throw new DomainError(
        "INVALID_ATTRIBUTE_VALUE",
        `error: invalid value for ${name}: ${value}`,
      );
    }
    const number = typeof value === "number" ? value : Number(value);
    return this.requireFinite(name, number);
  }

  private requireText(name: string, value: ShapeAttributeValue): string {
    const text = String(value);
    if (text.length === 0) {
      throw new DomainError(
        "INVALID_ATTRIBUTE_VALUE",
        `error: invalid value for ${name}: ${text}`,
      );
    }
    return text;
  }

  private setCommonAttribute(name: string, value: ShapeAttributeValue): boolean {
    if (name === "fill") {
      this.fill = this.requireText(name, value);
      return true;
    }
    if (name === "stroke") {
      this.stroke = this.requireText(name, value);
      return true;
    }
    if (name === "stroke-width") {
      this.strokeWidth = this.requireNonNegative(name, this.requireNumber(name, value));
      return true;
    }
    return false;
  }

  private styleAttributes(): Record<string, ShapeAttributeValue> {
    return {
      ...(this.fill === undefined ? {} : { fill: this.fill }),
      ...(this.stroke === undefined ? {} : { stroke: this.stroke }),
      ...(this.strokeWidth === undefined
        ? {}
        : { "stroke-width": this.strokeWidth }),
    };
  }
}
