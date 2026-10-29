import type {
  DocumentOperationGateway,
  DocumentReadResult,
  DocumentSaveResult,
} from "./DocumentOperationGateway.js";
import { ApplicationError } from "./ApplicationError.js";
import type { EditorSession } from "./EditorSession.js";
import type { SvgRepository } from "./SvgRepository.js";

export class DocumentService implements DocumentOperationGateway {
  public constructor(
    private readonly session: EditorSession,
    private readonly repository: SvgRepository,
  ) {}

  public async read(path: string): Promise<DocumentReadResult> {
    const loaded = await this.repository.load(path);
    this.session.replaceDocument(loaded.document, path);
    return {
      elementCount: loaded.document.getShapeCount(),
      path,
      warnings: loaded.warnings,
    };
  }

  public async save(path?: string): Promise<DocumentSaveResult> {
    const document = this.session.requireDocument();
    const target = path ?? this.session.getCurrentPath();
    if (target === undefined) {
      throw new ApplicationError(
        "NO_SAVE_PATH",
        "error: no save path. provide a file name",
      );
    }

    await this.repository.save(target, document);
    this.session.markSaved(target);
    return {
      elementCount: document.getShapeCount(),
      path: target,
    };
  }
}
