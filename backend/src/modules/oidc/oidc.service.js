import crypto from "crypto";

import { oidcConfig } from "../../config/oidc.js";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Application from "../applications/application.model.js";
import Session from "../sessions/session.model.js";

import * as sessionService from "../sessions/session.service.js";
import * as refreshTokenService from "../oauth/refreshToken.service.js";
import * as backchannelLogoutService from "./backchannelLogout.service.js";

import {
  BadRequestError,
  UnauthorizedError,
} from "../../shared/errors/index.js";

/**
 * Retourne le document
 * OpenID Connect Discovery.
 *
 * Il permet aux applications clientes
 * de découvrir automatiquement
 * les endpoints et capacités de CHAD-SSO.
 */
export const getOpenIdConfiguration = () => ({
  issuer: oidcConfig.issuer,

  authorization_endpoint: `${oidcConfig.issuer}/api/v1/oauth/authorize`,

  token_endpoint: `${oidcConfig.issuer}/api/v1/oauth/token`,

  userinfo_endpoint: `${oidcConfig.issuer}/api/v1/oidc/userinfo`,

  jwks_uri: `${oidcConfig.issuer}/.well-known/jwks.json`,

  end_session_endpoint: `${oidcConfig.issuer}/api/v1/oidc/end-session`,

  response_types_supported: ["code"],

  grant_types_supported: ["authorization_code", "refresh_token"],

  subject_types_supported: ["public"],

  id_token_signing_alg_values_supported: ["RS256"],

  scopes_supported: ["openid", "profile", "email"],

  token_endpoint_auth_methods_supported: ["client_secret_post", "none"],

  code_challenge_methods_supported: ["S256"],

  backchannel_logout_supported: true,
  backchannel_logout_session_supported: true,

  claims_supported: [
    "sub",
    "iss",
    "aud",
    "exp",
    "iat",
    "auth_time",
    "sid",
    "name",
    "given_name",
    "family_name",
    "email",
    "matricule",
    "roles",
  ],
});

/**
 * Retourne la clé publique de signature
 * au format JWKS.
 *
 * La clé privée n'est jamais exposée.
 */
export const getJwks = () => {
  /**
   * Création d'un KeyObject Node.js
   * à partir de notre clé publique PEM.
   */
  const publicKey = crypto.createPublicKey(oidcConfig.publicKey);

  /**
   * Conversion PEM -> JWK.
   *
   * Comme nous travaillons à partir
   * de la clé publique, Node exporte
   * uniquement les composants publics
   * RSA : kty, n et e.
   */
  const jwk = publicKey.export({
    format: "jwk",
  });

  return {
    keys: [
      {
        ...jwk,

        kid: oidcConfig.keyId,

        use: "sig",

        alg: "RS256",
      },
    ],
  };
};

export const endSession = async ({
  idTokenHint,
  postLogoutRedirectUri,
  state,
}) => {
  if (!idTokenHint) {
    throw new BadRequestError(
      "id_token_hint obligatoire",
      "ID_TOKEN_HINT_REQUIRED",
    );
  }

  let payload;

  try {
    payload = jwt.verify(idTokenHint, oidcConfig.publicKey, {
      algorithms: ["RS256"],
      issuer: oidcConfig.issuer,
      ignoreExpiration: true,
    });
  } catch {
    throw new UnauthorizedError("ID Token invalide", "INVALID_ID_TOKEN_HINT");
  }

  // Vérification du type de token.
  // Notre ID Token contient auth_time, contrairement
  // à notre Access Token actuel.
  if (
    !payload.sub ||
    !payload.sid ||
    typeof payload.auth_time !== "number" ||
    payload.client_id
  ) {
    throw new UnauthorizedError("ID Token invalide", "INVALID_ID_TOKEN_HINT");
  }

  if (
    typeof payload.aud !== "string" ||
    !mongoose.isValidObjectId(payload.sid)
  ) {
    throw new UnauthorizedError(
      "Audience ou session invalide",
      "INVALID_ID_TOKEN_HINT",
    );
  }

  const application = await Application.findOne({
    clientId: payload.aud,
  });

  if (!application) {
    throw new UnauthorizedError("Application inconnue", "UNKNOWN_OIDC_CLIENT");
  }

  // Comparaison exacte : aucune URI arbitraire acceptée.
  if (
    postLogoutRedirectUri &&
    !application.postLogoutRedirectUris.includes(postLogoutRedirectUri)
  ) {
    throw new BadRequestError(
      "URI de redirection après logout non autorisée",
      "INVALID_POST_LOGOUT_REDIRECT_URI",
    );
  }

  const session = await Session.findById(payload.sid).populate(
    "user",
    "_id matricule firstName lastName email",
  );

  // Empêcher qu'un ID Token valide d'une autre
  // identité puisse révoquer cette session.
  if (session && String(session.user?._id) !== String(payload.sub)) {
    throw new UnauthorizedError(
      "Session incompatible avec l'identité",
      "INVALID_ID_TOKEN_HINT",
    );
  }

  let backchannelResults = [];

  if (session) {
    backchannelResults =
      await backchannelLogoutService.notifyBackchannelParticipants({
        session,
      });

    await sessionService.revokeSessionById(session._id, "OIDC_LOGOUT");

    await refreshTokenService.revokeBySession({
      sessionId: session._id,
      reason: "OIDC_LOGOUT",
    });
  }

  console.log("[OIDC Back-Channel Logout]", backchannelResults);

  if (!postLogoutRedirectUri) {
    return { redirectUri: null };
  }

  const url = new URL(postLogoutRedirectUri);

  if (state !== undefined && state !== null) {
    url.searchParams.append("state", state);
  }

  return {
    redirectUri: url.toString(),
  };
};
