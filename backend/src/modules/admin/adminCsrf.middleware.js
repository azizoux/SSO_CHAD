import { ForbiddenError } from "../../shared/errors/index.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const requireAdminOrigin = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const allowedOrigins = (
    process.env.ADMIN_ALLOWED_ORIGINS || "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origin = req.get("Origin");

  if (!origin || !allowedOrigins.includes(origin)) {
    return next(
      new ForbiddenError(
        "Origine de la requête administrative non autorisée",
        "ADMIN_ORIGIN_DENIED",
      ),
    );
  }

  return next();
};
