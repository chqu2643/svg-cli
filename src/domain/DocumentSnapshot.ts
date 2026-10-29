import type { Shape } from "./Shape.js";

export class DocumentSnapshot {
  private readonly rootShapes: readonly Shape[];

  public constructor(
    private readonly width: number,
    private readonly height: number,
    rootShapes: readonly Shape[],
  ) {
    this.rootShapes = rootShapes.map((shape) => shape.clone());
  }

  public copyRootShapes(): readonly Shape[] {
    return this.rootShapes.map((shape) => shape.clone());
  }

  public getHeight(): number {
    return this.height;
  }

  public getWidth(): number {
    return this.width;
  }
}
