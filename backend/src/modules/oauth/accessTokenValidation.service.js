import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { oidcConfig } from "../../config/oidc.js";

import User from "../users/user.model.js";
import Application from "../applications/application.model.js";
import Session from "../sessions/session.model.js";

import * as accessService from "../access/userApplicationAccess.service.js";

import { evaluateApplicationAccess } from "../access/accessPolicy.service.js";

const inactive = () => ({ active: false });

export const validateAccessToken = async ({ token, expectedClientId }) => {
  if (
    typeof token !== "string" ||
    !token ||
    typeof expectedClientId !== "string" ||
    !expectedClientId
  ) {
    return inactive();
  }

  let payload;

  try {
    payload = jwt.verify(token, oidcConfig.publicKey, {
      algorithms: ["RS256"],
      issuer: oidcConfig.issuer,
      audience: expectedClientId,
    });
  } catch {
    return inactive();
  }

  if (
    payload.token_use !== "access" ||
    typeof payload.sub !== "string" ||
    typeof payload.sid !== "string" ||
    payload.client_id !== expectedClientId ||
    typeof payload.scope !== "string" ||
    !mongoose.isValidObjectId(payload.sub) ||
    !mongoose.isValidObjectId(payload.sid)
  ) {
    return inactive();
  }

  const [user, application, session] = await Promise.all([
    User.findById(payload.sub),
    Application.findOne({
      clientId: expectedClientId,
    }),
    Session.findById(payload.sid),
  ]);

  if (!user || !application || !session) {
    return inactive();
  }

  if (
    session.status !== "ACTIVE" ||
    !session.expiresAt ||
    session.expiresAt <= new Date() ||
    String(session.user) !== String(user._id)
  ) {
    return inactive();
  }

  const access = await accessService.getActiveAccess({
    userId: user._id,
    applicationId: application._id,
  });

  const requestedScopes = payload.scope.split(" ").filter(Boolean);

  const decision = evaluateApplicationAccess({
    user,
    application,
    access,
    requestedScopes,
  });

  if (!decision.allowed) {
    return inactive();
  }

  // Ne pas accorder plus de droits que ceux
  // contenus dans le jeton présenté.
  const tokenRoles = Array.isArray(payload.roles) ? payload.roles : [];

  const currentRoles = new Set(decision.roles);

  if (tokenRoles.some((role) => !currentRoles.has(role))) {
    return inactive();
  }

  return {
    active: true,
    sub: payload.sub,
    client_id: expectedClientId,
    token_type: "Bearer",
    scope: decision.scopes.join(" "),
    roles: tokenRoles,
    exp: payload.exp,
    iat: payload.iat,
    iss: payload.iss,
    aud: payload.aud,
  };
};
