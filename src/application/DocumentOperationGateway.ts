export interface DocumentReadResult {
  readonly elementCount: number;
  readonly path: string;
  readonly warnings: readonly string[];
}

export interface DocumentSaveResult {
  readonly elementCount: number;
  readonly path: string;
}

export interface DocumentOperationGateway {
  read(path: string): Promise<DocumentReadResult>;
  save(path?: string): Promise<DocumentSaveResult>;
}
