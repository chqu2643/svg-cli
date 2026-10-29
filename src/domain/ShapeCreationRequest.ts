import type { ShapeStyle } from "./ShapeStyle.js";

interface BaseShapeCreationRequest {
  readonly id: string;
  readonly style?: ShapeStyle;
}

export interface CircleCreationRequest extends BaseShapeCreationRequest {
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly type: "circle";
}

export interface EllipseCreationRequest extends BaseShapeCreationRequest {
  readonly cx: number;
  readonly cy: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly type: "ellipse";
}

export interface GroupCreationRequest extends BaseShapeCreationRequest {
  readonly type: "g";
}

export interface LineCreationRequest extends BaseShapeCreationRequest {
  readonly type: "line";
  readonly x1: number;
  readonly x2: number;
  readonly y1: number;
  readonly y2: number;
}

export interface RectCreationRequest extends BaseShapeCreationRequest {
  readonly height: number;
  readonly type: "rect";
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export interface TextCreationRequest extends BaseShapeCreationRequest {
  readonly text: string;
  readonly type: "text";
  readonly x: number;
  readonly y: number;
}

export type ShapeCreationRequest =
  | CircleCreationRequest
  | EllipseCreationRequest
  | GroupCreationRequest
  | LineCreationRequest
  | RectCreationRequest
  | TextCreationRequest;
