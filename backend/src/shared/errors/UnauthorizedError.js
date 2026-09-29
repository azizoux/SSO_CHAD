import AppError from "./AppError.js";

export default class UnauthorizedError extends AppError {
  constructor(
    message = "Authentification requise",
    code = "UNAUTHORIZED",
    details = null,
  ) {
    super(message, 401, code, details);
  }
}
