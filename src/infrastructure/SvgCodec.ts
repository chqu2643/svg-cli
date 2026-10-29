import { XMLParser, XMLValidator } from "fast-xml-parser";

import {
  DomainError,
  ShapeFactory,
  SvgDocument,
  type Shape,
  type ShapeDescription,
} from "../domain/index.js";
import { InfrastructureError } from "./InfrastructureError.js";

type OrderedNode = Record<string, unknown>;

export interface SvgDecodeResult {
  readonly document: SvgDocument;
  readonly warnings: readonly string[];
}

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
  "fill",
  "stroke",
  "stroke-width",
] as const;

export class SvgCodec {
  private readonly parser = new XMLParser({
    attributeNamePrefix: "",
    ignoreAttributes: false,
    parseAttributeValue: false,
    parseTagValue: false,
    preserveOrder: true,
    processEntities: true,
    trimValues: false,
  });

  public constructor(private readonly shapeFactory = new ShapeFactory()) {}

  public decode(source: string): SvgDecodeResult {
    if (/<!DOCTYPE/iu.test(source)) {
      throw new InfrastructureError("error: invalid SVG: DOCTYPE is not supported");
    }
    const validation = XMLValidator.validate(source);
    if (validation !== true) {
      throw new InfrastructureError(
        `error: invalid SVG: ${validation.err.msg}`,
      );
    }

    const parsed: unknown = this.parser.parse(source);
    if (!Array.isArray(parsed)) {
      throw new InfrastructureError("error: invalid SVG: missing <svg> root");
    }
    const roots = parsed.filter(
      (node): node is OrderedNode => this.elementName(node) === "svg",
    );
    if (roots.length !== 1) {
      throw new InfrastructureError("error: invalid SVG: expected one <svg> root");
    }
    const root = roots[0];
    if (root === undefined) {
      throw new InfrastructureError("error: invalid SVG: missing <svg> root");
    }

    const rootAttributes = this.attributesOf(root);
    this.validateRootAttributes(rootAttributes);
    const { height, width } = this.readCanvasSize(rootAttributes);
    const document = new SvgDocument(width, height);
    const reservedIds = this.collectExplicitIds(this.childrenOf(root, "svg"));
    const counters = new Map<string, number>();
    const warnings: string[] = [];

    for (const child of this.childrenOf(root, "svg")) {
      if (this.elementName(child) !== undefined) {
        this.addElement(child, document, undefined, reservedIds, counters, warnings);
      }
    }
    return { document, warnings };
  }

  public encode(document: SvgDocument): string {
    const canvas = document.getCanvasSize();
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${String(canvas.width)}" height="${String(canvas.height)}" viewBox="0 0 ${String(canvas.width)} ${String(canvas.height)}">`,
    ];
    for (const shape of document.getRootShapes()) {
      this.appendShape(lines, shape.describe(), 1);
    }
    lines.push("</svg>");
    return `${lines.join("\n")}\n`;
  }

  private addElement(
    node: OrderedNode,
    document: SvgDocument,
    parentId: string | undefined,
    reservedIds: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): void {
    const type = this.elementName(node);
    if (type === undefined) {
      return;
    }
    const attributes = this.attributesOf(node);
    const id = attributes.id ?? this.assignId(type, reservedIds, counters, warnings);
    const children = this.childrenOf(node, type);
    const text = this.directText(children);
    const request = this.shapeFactory.createRequestFromAttributes(
      type,
      id,
      attributes,
      text,
    );
    const shape = this.shapeFactory.create(request);
    this.applyStyles(shape, attributes);
    document.addShape(shape, parentId);

    const elementChildren = children.filter(
      (child) => this.elementName(child) !== undefined,
    );
    if (elementChildren.length > 0 && shape.asContainer() === undefined) {
      throw new InfrastructureError(
        `error: unsupported nested SVG content in <${type}>`,
      );
    }
    for (const child of elementChildren) {
      this.addElement(child, document, id, reservedIds, counters, warnings);
    }

    const transform = attributes.transform;
    if (transform !== undefined) {
      this.applyTransform(shape, transform);
    }
  }

  private appendShape(
    lines: string[],
    shape: ShapeDescription,
    depth: number,
  ): void {
    const indent = "  ".repeat(depth);
    const attributes = [
      `id="${this.escapeAttribute(shape.id)}"`,
      ...Object.entries(shape.attributes)
        .filter(([name]) => name !== "text")
        .sort(([left], [right]) => this.attributeRank(left) - this.attributeRank(right))
        .map(
          ([name, value]) =>
            `${name}="${this.escapeAttribute(String(value))}"`,
        ),
    ].join(" ");
    const children = shape.children;
    if (children !== undefined) {
      if (children.length === 0) {
        lines.push(`${indent}<${shape.type} ${attributes}/>`);
        return;
      }
      lines.push(`${indent}<${shape.type} ${attributes}>`);
      for (const child of children) {
        this.appendShape(lines, child, depth + 1);
      }
      lines.push(`${indent}</${shape.type}>`);
      return;
    }

    const text = shape.attributes.text;
    if (text !== undefined) {
      lines.push(
        `${indent}<${shape.type} ${attributes}>${this.escapeText(String(text))}</${shape.type}>`,
      );
      return;
    }
    lines.push(`${indent}<${shape.type} ${attributes}/>`);
  }

  private applyStyles(
    shape: Shape,
    attributes: Readonly<Record<string, string>>,
  ): void {
    for (const name of ["fill", "stroke", "stroke-width"] as const) {
      const value = attributes[name];
      if (value !== undefined) {
        shape.setAttribute(name, value);
      }
    }
  }

  private applyTransform(shape: Shape, source: string): void {
    const operations: Array<
      | { readonly kind: "move"; readonly x: number; readonly y: number }
      | { readonly factor: number; readonly kind: "scale" }
    > = [];
    const pattern = /([a-zA-Z]+)\s*\(([^)]*)\)/gu;
    let consumed = "";
    for (const match of source.matchAll(pattern)) {
      consumed += match[0];
      const name = match[1];
      const values = (match[2] ?? "")
        .trim()
        .split(/[\s,]+/u)
        .filter((value) => value.length > 0)
        .map(Number);
      if (values.some((value) => !Number.isFinite(value))) {
        throw new InfrastructureError(`error: invalid SVG transform: ${source}`);
      }
      if (name === "translate" && (values.length === 1 || values.length === 2)) {
        operations.push({
          kind: "move",
          x: values[0] ?? 0,
          y: values[1] ?? 0,
        });
      } else if (
        name === "scale" &&
        (values.length === 1 ||
          (values.length === 2 && values[0] === values[1]))
      ) {
        operations.push({ factor: values[0] ?? Number.NaN, kind: "scale" });
      } else {
        throw new InfrastructureError(
          `error: unsupported SVG transform: ${source}`,
        );
      }
    }
    if (consumed.replace(/[\s,]/gu, "") !== source.replace(/[\s,]/gu, "")) {
      throw new InfrastructureError(`error: invalid SVG transform: ${source}`);
    }
    for (const operation of operations.reverse()) {
      if (operation.kind === "move") {
        shape.move(operation.x, operation.y);
      } else {
        shape.scale(operation.factor);
      }
    }
  }

  private assignId(
    type: string,
    reservedIds: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): string {
    let counter = counters.get(type) ?? 0;
    let id: string;
    do {
      counter += 1;
      id = `${type}${String(counter)}`;
    } while (reservedIds.has(id));
    counters.set(type, counter);
    reservedIds.add(id);
    warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
    return id;
  }

  private attributesOf(node: OrderedNode): Readonly<Record<string, string>> {
    const raw = node[":@"];
    if (raw === undefined || typeof raw !== "object" || raw === null) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(raw).map(([name, value]) => [name, String(value)]),
    );
  }

  private childrenOf(node: OrderedNode, name: string): readonly OrderedNode[] {
    const value = node[name];
    return Array.isArray(value)
      ? value.filter(
          (child): child is OrderedNode =>
            typeof child === "object" && child !== null && !Array.isArray(child),
        )
      : [];
  }

  private collectExplicitIds(nodes: readonly OrderedNode[]): Set<string> {
    const ids = new Set<string>();
    const visit = (node: OrderedNode): void => {
      const name = this.elementName(node);
      if (name === undefined) {
        return;
      }
      const id = this.attributesOf(node).id;
      if (id !== undefined) {
        if (ids.has(id)) {
          throw new DomainError("DUPLICATE_ID", `error: id already exists: ${id}`);
        }
        ids.add(id);
      }
      for (const child of this.childrenOf(node, name)) {
        visit(child);
      }
    };
    for (const node of nodes) {
      visit(node);
    }
    return ids;
  }

  private directText(children: readonly OrderedNode[]): string {
    return children
      .map((child) => child["#text"])
      .filter((value): value is string | number =>
        typeof value === "string" || typeof value === "number",
      )
      .join("");
  }

  private elementName(value: unknown): string | undefined {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return undefined;
    }
    return Object.keys(value).find(
      (name) => name !== ":@" && !name.startsWith("#") && !name.startsWith("?") && !name.startsWith("!"),
    );
  }

  private readCanvasSize(
    attributes: Readonly<Record<string, string>>,
  ): { readonly height: number; readonly width: number } {
    const viewBox =
      attributes.viewBox === undefined
        ? undefined
        : this.parseViewBox(attributes.viewBox);
    const width =
      attributes.width === undefined
        ? viewBox?.[2]
        : this.parseDimension("width", attributes.width);
    const height =
      attributes.height === undefined
        ? viewBox?.[3]
        : this.parseDimension("height", attributes.height);
    if (width === undefined || height === undefined) {
      throw new InfrastructureError(
        "error: invalid SVG: root width and height are required",
      );
    }
    return { height, width };
  }

  private parseDimension(name: string, value: string): number {
    const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(?:px)?$/iu.exec(
      value.trim(),
    );
    if (match === null) {
      throw new InfrastructureError(
        `error: invalid SVG ${name}: ${value}`,
      );
    }
    return Number(match[1]);
  }

  private parseViewBox(value: string): readonly number[] {
    const values = value.trim().split(/[\s,]+/u).map(Number);
    if (
      values.length !== 4 ||
      values.some((part) => !Number.isFinite(part)) ||
      (values[2] ?? 0) <= 0 ||
      (values[3] ?? 0) <= 0
    ) {
      throw new InfrastructureError(`error: invalid SVG viewBox: ${value}`);
    }
    return values;
  }

  private validateRootAttributes(
    attributes: Readonly<Record<string, string>>,
  ): void {
    const allowed = new Set(["height", "version", "viewBox", "width", "xmlns"]);
    for (const name of Object.keys(attributes)) {
      if (!allowed.has(name) && !name.startsWith("xmlns:")) {
        throw new InfrastructureError(
          `error: unsupported SVG root attribute: ${name}`,
        );
      }
    }
  }

  private attributeRank(name: string): number {
    const index = ATTRIBUTE_ORDER.indexOf(name as (typeof ATTRIBUTE_ORDER)[number]);
    return index < 0 ? ATTRIBUTE_ORDER.length : index;
  }

  private escapeAttribute(value: string): string {
    return this.escapeText(value).replace(/"/gu, "&quot;");
  }

  private escapeText(value: string): string {
    return value.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");
  }
}
