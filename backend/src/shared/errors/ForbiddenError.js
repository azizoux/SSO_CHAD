import AppError from "./AppError.js";

export default class ForbiddenError extends AppError {
  constructor(message = "Accès interdit", code = "FORBIDDEN", details = null) {
    super(message, 403, code, details);
  }
}
