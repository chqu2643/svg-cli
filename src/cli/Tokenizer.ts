import { CliError } from "./CliError.js";

export class Tokenizer {
  public tokenize(line: string): readonly string[] {
    if (line.trimStart().startsWith("#")) {
      return [];
    }

    const tokens: string[] = [];
    let current = "";
    let inQuotes = false;
    let tokenStarted = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === undefined) {
        continue;
      }

      if (inQuotes && character === "\\") {
        const next = line[index + 1];
        if (next === '"' || next === "\\") {
          current += next;
          index += 1;
          continue;
        }
      }

      if (character === '"') {
        inQuotes = !inQuotes;
        tokenStarted = true;
        continue;
      }

      if (!inQuotes && /\s/u.test(character)) {
        if (tokenStarted) {
          tokens.push(current);
          current = "";
          tokenStarted = false;
        }
        continue;
      }

      current += character;
      tokenStarted = true;
    }

    if (inQuotes) {
      throw new CliError("error: unterminated quoted string");
    }
    if (tokenStarted) {
      tokens.push(current);
    }
    return tokens;
  }
}
