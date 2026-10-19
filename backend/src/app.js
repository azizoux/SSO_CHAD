import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { ForbiddenError } from "./shared/errors/index.js";
import notFoundHandler from "./shared/middleware/notFoundHandler.js";
import errorHandler from "./shared/middleware/errorHandler.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import applicationRoutes from "./modules/applications/application.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import oauthRoutes from "./modules/oauth/oauth.routes.js";
import oidcRoutes from "./modules/oidc/oidc.routes.js";
import userApplicationAccessRoutes from "./modules/access/userApplicationAccess.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

const app = express();

/**
 * Middlewares globaux.
 */
app.use(helmet());
const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new ForbiddenError("Origine CORS non autorisée", "CORS_ORIGIN_DENIED"),
      );
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan((tokens, req, res) => {
    return [
      tokens.method(req, res),
      req.path,
      tokens.status(req, res),
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  }),
);

/**
 * Health check.
 */
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "CHAD-SSO",
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

app.use(express.static(path.resolve(process.cwd(), "public")));

/**
 * API V1.
 */
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/oauth", oauthRoutes);
app.use("/api/v1/access", userApplicationAccessRoutes);
app.use("/api/v1/admin", adminRoutes);
/**
 * OpenID Connect Discovery + JWKS.
 *
 * Ces endpoints sont volontairement
 * publics.
 */
app.use("/.well-known", oidcRoutes);
// Endpoint de déconnexion OIDC
app.use("/api/v1/oidc", oidcRoutes);

app.get("/login", (req, res) => {
  res.sendFile(path.resolve(process.cwd(), "public/login.html"));
});

/**
 * Route inexistante.
 *
 * Doit être placé après
 * toutes les routes.
 */
app.use(notFoundHandler);

/**
 * Gestionnaire global d'erreurs.
 *
 * Doit toujours être le dernier
 * middleware Express.
 */
app.use(errorHandler);

export default app;
