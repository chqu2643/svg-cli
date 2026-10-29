import { randomUUID } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import type {
  SvgLoadResult,
  SvgRepository,
} from "../application/index.js";
import type { SvgDocument } from "../domain/index.js";
import { InfrastructureError } from "./InfrastructureError.js";
import { SvgCodec } from "./SvgCodec.js";

export class FileSvgRepository implements SvgRepository {
  public constructor(private readonly codec = new SvgCodec()) {}

  public async load(path: string): Promise<SvgLoadResult> {
    let source: string;
    try {
      source = await readFile(path, "utf8");
    } catch {
      throw new InfrastructureError(`error: cannot read file: ${path}`);
    }
    return this.codec.decode(source);
  }

  public async save(path: string, document: SvgDocument): Promise<void> {
    const output = this.codec.encode(document);
    const target = resolve(path);
    const temporary = join(
      dirname(target),
      `.${basename(target)}.${String(process.pid)}.${randomUUID()}.tmp`,
    );
    try {
      await writeFile(temporary, output, { encoding: "utf8", flag: "wx" });
      await rename(temporary, target);
    } catch {
      await rm(temporary, { force: true }).catch(() => undefined);
      throw new InfrastructureError(`error: cannot write file: ${path}`);
    }
  }
}
