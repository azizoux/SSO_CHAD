import jwt from "jsonwebtoken";

import { oidcConfig } from "../../config/oidc.js";

export const createAccessToken = ({ user, application, scopes, session }) => {
  const expiresIn = application.accessTokenLifetime || 900;

  const payload = {
    sub: user._id.toString(),

    client_id: application.clientId,

    scope: scopes.join(" "),

    sid: session._id.toString(),

    roles: user.roles || [],
  };

  const accessToken = jwt.sign(payload, oidcConfig.privateKey, {
    algorithm: "RS256",

    issuer: oidcConfig.issuer,

    audience: application.clientId,

    expiresIn,

    keyid: oidcConfig.keyId,
  });

  return {
    accessToken,
    expiresIn,
  };
};

export const createIdToken = ({ user, application, scopes, session }) => {
  const payload = {
    sub: user._id.toString(),

    sid: session._id.toString(),

    auth_time: Math.floor(new Date(session.authenticatedAt).getTime() / 1000),
  };

  /**
   * Claims liés aux scopes.
   */
  if (scopes.includes("profile")) {
    payload.given_name = user.firstName;

    payload.family_name = user.lastName;

    payload.name = `${user.firstName} ${user.lastName}`.trim();

    payload.matricule = user.matricule;
  }

  if (scopes.includes("email") && user.email) {
    payload.email = user.email;
  }

  return jwt.sign(payload, oidcConfig.privateKey, {
    algorithm: "RS256",

    issuer: oidcConfig.issuer,

    audience: application.clientId,

    expiresIn: 900,

    keyid: oidcConfig.keyId,
  });
};
