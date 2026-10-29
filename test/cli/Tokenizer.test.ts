import { describe, expect, it } from "vitest";

import { Tokenizer } from "../../src/cli/Tokenizer.js";

describe("Tokenizer", () => {
  const tokenizer = new Tokenizer();

  it("keeps quoted text together and supports quote and slash escapes", () => {
    expect(
      tokenizer.tokenize('set title text "A \\"quoted\\" \\\\ path"'),
    ).toEqual(["set", "title", "text", 'A "quoted" \\ path']);
    expect(tokenizer.tokenize('create text empty 0 0 ""')).toEqual([
      "create",
      "text",
      "empty",
      "0",
      "0",
      "",
    ]);
  });

  it("distinguishes full-line comments from hexadecimal colors", () => {
    expect(tokenizer.tokenize("   # a comment")).toEqual([]);
    expect(tokenizer.tokenize("create rect r1 0 0 1 1 #4a90d9")).toEqual([
      "create",
      "rect",
      "r1",
      "0",
      "0",
      "1",
      "1",
      "#4a90d9",
    ]);
  });

  it("rejects an unterminated quoted string", () => {
    expect(() => tokenizer.tokenize('set t1 text "unfinished')).toThrowError(
      "error: unterminated quoted string",
    );
  });
});
