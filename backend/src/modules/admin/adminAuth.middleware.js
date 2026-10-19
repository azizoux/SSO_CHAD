import * as sessionService from "../sessions/session.service.js";

import {
  UnauthorizedError,
  ForbiddenError,
} from "../../shared/errors/index.js";

export const requireSuperAdmin = async (req, res, next) => {
  try {
    const cookieName = process.env.SSO_COOKIE_NAME || "chad_sso_session";

    const sessionToken = req.cookies?.[cookieName];

    if (!sessionToken) {
      throw new UnauthorizedError(
        "Authentification administrateur requise",
        "ADMIN_AUTH_REQUIRED",
      );
    }

    const session = await sessionService.getSessionByToken(sessionToken);

    if (!session || !session.user) {
      throw new UnauthorizedError(
        "Session invalide ou expirée",
        "ADMIN_SESSION_INVALID",
      );
    }

    const user = session.user;

    if (user.status !== "ACTIVE") {
      throw new ForbiddenError(
        "Compte utilisateur non autorisé",
        "ADMIN_ACCOUNT_DISABLED",
      );
    }

    if (!user.roles?.includes("SUPER_ADMIN")) {
      throw new ForbiddenError(
        "Privilèges administrateur insuffisants",
        "ADMIN_ACCESS_DENIED",
      );
    }

    req.adminUser = user;
    req.adminSession = session;

    return next();
  } catch (error) {
    return next(error);
  }
};
