import AppError from "./AppError.js";

export default class NotFoundError extends AppError {
  constructor(
    message = "Ressource introuvable",
    code = "NOT_FOUND",
    details = null,
  ) {
    super(message, 404, code, details);
  }
}
