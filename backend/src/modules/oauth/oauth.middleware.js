import jwt from "jsonwebtoken";

import { oidcConfig } from "../../config/oidc.js";

import { UnauthorizedError } from "../../shared/errors/index.js";

/**
 * Authentifie un Access Token CHAD-SSO transmis avec :
 *
 * Authorization: Bearer <access_token>
 *
 * La signature RS256 est vérifiée avec la clé publique
 * du serveur CHAD-SSO.
 *
 * L'audience n'est pas fixée ici car /userinfo peut
 * être appelé par plusieurs applications clientes.
 */
export const authenticateBearer = (req, res, next) => {
  const authorization = req.get("authorization");

  if (!authorization) {
    return next(
      new UnauthorizedError("Access Token requis", "ACCESS_TOKEN_REQUIRED"),
    );
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return next(
      new UnauthorizedError(
        "Authorization Bearer invalide",
        "INVALID_AUTHORIZATION_HEADER",
      ),
    );
  }

  try {
    const payload = jwt.verify(token, oidcConfig.publicKey, {
      algorithms: ["RS256"],
      issuer: oidcConfig.issuer,
    });

    /*
     * Protection supplémentaire :
     * un Access Token CHAD-SSO possède client_id.
     *
     * Cela évite notamment d'accepter accidentellement
     * un ID Token sur /userinfo.
     */
    if (!payload.client_id) {
      return next(
        new UnauthorizedError("Access Token invalide", "INVALID_ACCESS_TOKEN"),
      );
    }

    req.accessToken = payload;

    return next();
  } catch {
    return next(
      new UnauthorizedError(
        "Access Token invalide ou expiré",
        "INVALID_ACCESS_TOKEN",
      ),
    );
  }
};
