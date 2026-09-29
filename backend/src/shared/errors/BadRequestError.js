import AppError from "./AppError.js";

export default class BadRequestError extends AppError {
  constructor(
    message = "Requête invalide",
    code = "BAD_REQUEST",
    details = null,
  ) {
    super(message, 400, code, details);
  }
}
