export type ShapeType = "circle" | "ellipse" | "g" | "line" | "rect" | "text";

export type ShapeAttributeValue = number | string;

export interface ShapeDescription {
  readonly attributes: Readonly<Record<string, ShapeAttributeValue>>;
  readonly children?: readonly ShapeDescription[];
  readonly id: string;
  readonly type: ShapeType;
}
