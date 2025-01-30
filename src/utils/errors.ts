export class CustomError extends Error {
  public statusCode: number;
  public message: string;

  constructor(statusCode: number, message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.message = message;
  }
}

export class NotAuthorizedError extends CustomError {
  constructor(message: string) {
    super(401, message);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string) {
    super(404, message);
  }
}

// / Adding a new BadRequestError for 400 status code
export class BadRequestError extends CustomError {
  constructor(message: string) {
    super(400, message);
  }
}
