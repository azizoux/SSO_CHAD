import AppError from "./AppError.js";

export default class ConflictError extends AppError {
  constructor(
    message = "Conflit avec une ressource existante",
    code = "CONFLICT",
    details = null,
  ) {
    super(message, 409, code, details);
  }
}
