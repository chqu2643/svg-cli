import type { DocumentTreeView } from "../application/index.js";

type TreeShape = DocumentTreeView["roots"][number];

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

export class TreeFormatter {
  public format(view: DocumentTreeView, includeCanvas = true): string {
    const lines: string[] = [];
    if (includeCanvas) {
      lines.push(`svg (${String(view.width)}x${String(view.height)})`);
      this.appendChildren(lines, view.roots, "");
    } else {
      const root = view.roots[0];
      if (root !== undefined) {
        lines.push(this.formatShape(root));
        this.appendChildren(lines, root.children ?? [], "");
      }
    }
    return lines.join("\n");
  }

  private appendChildren(
    lines: string[],
    children: readonly TreeShape[],
    prefix: string,
  ): void {
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      lines.push(`${prefix}${isLast ? "└── " : "├── "}${this.formatShape(child)}`);
      this.appendChildren(
        lines,
        child.children ?? [],
        `${prefix}${isLast ? "    " : "│   "}`,
      );
    });
  }

  private formatShape(shape: TreeShape): string {
    const entries = Object.entries(shape.attributes).sort(
      ([left], [right]) => this.attributeRank(left) - this.attributeRank(right),
    );
    const text = shape.attributes.text;
    const x = shape.attributes.x;
    const y = shape.attributes.y;
    const textSummary =
      text === undefined || x === undefined || y === undefined
        ? []
        : [`(${String(x)},${String(y)})`, JSON.stringify(String(text))];
    const x1 = shape.attributes.x1;
    const y1 = shape.attributes.y1;
    const x2 = shape.attributes.x2;
    const y2 = shape.attributes.y2;
    const lineSummary =
      x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined
        ? []
        : [`(${String(x1)},${String(y1)})`, "->", `(${String(x2)},${String(y2)})`];
    const attributes = entries
      .filter(
        ([name]) =>
          (textSummary.length === 0 || !["text", "x", "y"].includes(name)) &&
          (lineSummary.length === 0 || !["x1", "y1", "x2", "y2"].includes(name)),
      )
      .map(([name, value]) => {
        const displayName =
          name === "width" ? "w" : name === "height" ? "h" : name;
        return `${displayName}=${String(value)}`;
      });
    const summary = [...textSummary, ...lineSummary, ...attributes];
    return `${shape.type}#${shape.id}${summary.length === 0 ? "" : `  ${summary.join(" ")}`}`;
  }

  private attributeRank(name: string): number {
    const index = ATTRIBUTE_ORDER.indexOf(name as (typeof ATTRIBUTE_ORDER)[number]);
    return index < 0 ? ATTRIBUTE_ORDER.length : index;
  }
}
