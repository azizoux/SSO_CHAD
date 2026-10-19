import jwt from "jsonwebtoken";
import crypto from "crypto";

import { oidcConfig } from "../../config/oidc.js";

const BACKCHANNEL_LOGOUT_EVENT =
  "http://schemas.openid.net/event/backchannel-logout";

export const createLogoutToken = ({ session, application, user }) => {
  if (!session?._id) {
    throw new Error("Session requise pour générer le logout_token");
  }

  if (!application?.clientId) {
    throw new Error("Application requise pour générer le logout_token");
  }

  const subject =
    user?._id?.toString?.() ||
    session.user?._id?.toString?.() ||
    session.user?.toString?.();

  if (!subject) {
    throw new Error("Utilisateur requis pour générer le logout_token");
  }

  const payload = {
    sub: subject,

    sid: session._id.toString(),

    jti: crypto.randomUUID(),

    events: {
      [BACKCHANNEL_LOGOUT_EVENT]: {},
    },
  };

  return jwt.sign(payload, oidcConfig.privateKey, {
    algorithm: "RS256",
    keyid: oidcConfig.keyId,
    issuer: oidcConfig.issuer,
    audience: application.clientId,
    expiresIn: "2m",
  });
};

export const createAccessToken = ({
  user,
  application,
  scopes,
  session,
  applicationRoles = [],
}) => {
  const expiresIn = application.accessTokenLifetime || 900;

  const payload = {
    sub: user._id.toString(),

    client_id: application.clientId,

    scope: scopes.join(" "),

    sid: session._id.toString(),

    // Rôles propres à l'application cliente.
    // Ne jamais utiliser ici les rôles globaux de CHAD-SSO.
    roles: applicationRoles,
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

export const createIdToken = ({
  user,
  application,
  scopes,
  session,
  nonce,
}) => {
  const payload = {
    sub: user._id.toString(),
    sid: session._id.toString(),
    auth_time: Math.floor(new Date(session.authenticatedAt).getTime() / 1000),
    nonce,
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
