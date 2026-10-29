import type { ShapeView } from "../application/index.js";

const ATTRIBUTE_ORDER = [
  "x",
  "y",
  "width",
  "height",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x1",
  "y1",
  "x2",
  "y2",
  "text",
  "fill",
  "stroke",
  "stroke-width",
] as const;

export class ShowFormatter {
  public format(view: ShapeView): string {
    const shape = view.description;
    const lines = [
      `${shape.type}#${shape.id}  parent=${view.parentId === undefined ? "svg" : `g#${view.parentId}`}`,
    ];
    const entries = Object.entries(shape.attributes).sort(
      ([left], [right]) => this.attributeRank(left) - this.attributeRank(right),
    );
    const styleNames = new Set(["fill", "stroke", "stroke-width"]);
    const geometry = entries.filter(([name]) => !styleNames.has(name));
    const text = shape.attributes.text;
    const x = shape.attributes.x;
    const y = shape.attributes.y;
    if (text !== undefined && x !== undefined && y !== undefined) {
      lines.push(`  (${String(x)},${String(y)}) ${JSON.stringify(String(text))}`);
    } else if (geometry.length > 0) {
      lines.push(
        `  ${geometry.map(([name, value]) => `${name}=${String(value)}`).join(" ")}`,
      );
    }
    for (const [name, value] of entries.filter(([name]) => styleNames.has(name))) {
      lines.push(`  ${name}=${String(value)}`);
    }
    return lines.join("\n");
  }

  private attributeRank(name: string): number {
    const index = ATTRIBUTE_ORDER.indexOf(name as (typeof ATTRIBUTE_ORDER)[number]);
    return index < 0 ? ATTRIBUTE_ORDER.length : index;
  }
}
