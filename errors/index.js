export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class RowNotFoundError extends DomainError {
  constructor() {
    super('Row not found.');
    this.statusCode = 404;
  }
}