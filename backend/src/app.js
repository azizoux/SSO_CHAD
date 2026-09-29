import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import notFoundHandler from "./shared/middleware/notFoundHandler.js";
import errorHandler from "./shared/middleware/errorHandler.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import applicationRoutes from "./modules/applications/application.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import oauthRoutes from "./modules/oauth/oauth.routes.js";
import oidcRoutes from "./modules/oidc/oidc.routes.js";

const app = express();

/**
 * Middlewares globaux.
 */
app.use(helmet());
app.use(cors());

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(morgan("dev"));

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

/**
 * API V1.
 */
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/oauth", oauthRoutes);
/**
 * OpenID Connect Discovery + JWKS.
 *
 * Ces endpoints sont volontairement
 * publics.
 */
app.use("/.well-known", oidcRoutes);

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
