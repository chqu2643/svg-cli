import { describe, expect, it } from "vitest";

import {
  Circle,
  Ellipse,
  Group,
  Line,
  Rect,
  SvgDocument,
  TextShape,
} from "../../src/domain/index.js";
import { SvgCodec } from "../../src/infrastructure/index.js";

describe("SvgCodec", () => {
  const codec = new SvgCodec();

  it("round-trips all built-in shapes, nesting, styles, and escaped text", () => {
    const document = new SvgDocument(640, 480);
    document.addShape(
      new Group("scene", { stroke: "black", strokeWidth: 2 }, [
        new Rect("r1", 1, 2, 3, 4, { fill: "red" }),
        new Circle("c1", 10, 20, 5),
        new Ellipse("e1", 30, 40, 6, 7),
        new Line("l1", 0, 1, 2, 3, { stroke: "blue" }),
        new TextShape("t1", 8, 9, 'A & <B> "quoted"'),
        new Group("empty"),
      ]),
    );

    const encoded = codec.encode(document);
    expect(encoded).toContain("A &amp; &lt;B&gt; \"quoted\"");
    expect(encoded).toContain('stroke-width="2"');

    const decoded = codec.decode(encoded);
    expect(decoded.warnings).toEqual([]);
    expect(decoded.document.getCanvasSize()).toEqual({ height: 480, width: 640 });
    expect(decoded.document.getRootShapes().map((shape) => shape.describe())).toEqual(
      document.getRootShapes().map((shape) => shape.describe()),
    );
  });

  it("assigns missing IDs without colliding with later explicit IDs", () => {
    const result = codec.decode(`
      <svg width="100" height="80">
        <rect x="0" y="0" width="1" height="1"/>
        <rect id="rect1" x="1" y="1" width="2" height="2"/>
        <rect x="2" y="2" width="3" height="3"/>
        <circle cx="5" cy="6" r="2"/>
      </svg>
    `);

    expect(result.document.getRootShapes().map((shape) => shape.getId())).toEqual([
      "rect2",
      "rect1",
      "rect3",
      "circle1",
    ]);
    expect(result.warnings).toEqual([
      "warning: assigned id rect2 to unnamed <rect>",
      "warning: assigned id rect3 to unnamed <rect>",
      "warning: assigned id circle1 to unnamed <circle>",
    ]);
  });

  it("normalizes translate and uniform scale transforms into geometry", () => {
    const result = codec.decode(`
      <svg width="100px" height="80px">
        <g id="g1" transform="translate(10,20) scale(2)">
          <rect id="r1" x="1" y="2" width="3" height="4"/>
        </g>
      </svg>
    `);

    expect(result.document.requireShape("r1").describe().attributes).toEqual({
      height: 8,
      width: 6,
      x: 12,
      y: 24,
    });
    expect(codec.encode(result.document)).not.toContain("transform=");
  });

  it("uses viewBox dimensions when width and height are absent", () => {
    const result = codec.decode(
      '<svg viewBox="0 0 320 240"><circle id="c1" cx="1" cy="2" r="3"/></svg>',
    );
    expect(result.document.getCanvasSize()).toEqual({ height: 240, width: 320 });
  });

  it("rejects duplicate IDs and unsupported or unsafe SVG", () => {
    expect(() =>
      codec.decode(
        '<svg width="1" height="1"><rect id="a" x="0" y="0" width="1" height="1"/><circle id="a" cx="0" cy="0" r="1"/></svg>',
      ),
    ).toThrowError("error: id already exists: a");
    expect(() =>
      codec.decode(
        '<svg width="1" height="1"><rect id="a" x="0" y="0" width="1" height="1" opacity="0.5"/></svg>',
      ),
    ).toThrowError("error: unsupported SVG attribute: opacity on <rect>");
    expect(() =>
      codec.decode('<svg width="1" height="1"><path id="p" d="M0 0"/></svg>'),
    ).toThrowError("error: unknown shape type: path (is the plugin loaded?)");
    expect(() =>
      codec.decode('<svg width="1" height="1" viewBox="0 0 nope 1"/>'),
    ).toThrowError("error: invalid SVG viewBox: 0 0 nope 1");
    expect(() =>
      codec.decode(
        '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg width="1" height="1"/>',
      ),
    ).toThrowError("error: invalid SVG: DOCTYPE is not supported");
  });
});
