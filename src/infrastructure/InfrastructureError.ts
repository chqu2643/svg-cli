export class InfrastructureError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InfrastructureError";
  }
}
