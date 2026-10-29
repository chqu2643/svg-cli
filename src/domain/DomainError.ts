export type DomainErrorCode =
  | "CANNOT_UNGROUP_COMPOSITE"
  | "CANNOT_UNGROUP_TOP_LEVEL"
  | "CONTAINER_CYCLE"
  | "DUPLICATE_GROUP_MEMBER"
  | "DUPLICATE_ID"
  | "EMPTY_GROUP"
  | "INVALID_ATTRIBUTE_VALUE"
  | "INVALID_CANVAS_SIZE"
  | "INVALID_CREATE_ARGUMENTS"
  | "INVALID_ID"
  | "INVALID_SCALE_FACTOR"
  | "NOT_A_CONTAINER"
  | "SHAPE_NOT_FOUND"
  | "UNKNOWN_ATTRIBUTE"
  | "UNKNOWN_SHAPE_TYPE";

export class DomainError extends Error {
  public constructor(
    public readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
