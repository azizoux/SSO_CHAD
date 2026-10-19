import bcrypt from "bcryptjs";

import Application from "../applications/application.model.js";

import { UnauthorizedError } from "../../shared/errors/index.js";

import asyncHandler from "../../shared/utils/asyncHandler.js";

import { validateAccessToken } from "./accessTokenValidation.service.js";

export const introspect = asyncHandler(async (req, res) => {
  // Authentification du client confidentiel
  // via HTTP Basic.
  const authorization = req.get("authorization") || "";

  const match = /^Basic ([A-Za-z0-9+/=]+)$/.exec(authorization);

  if (!match) {
    res.set("WWW-Authenticate", 'Basic realm="CHAD-SSO"');

    throw new UnauthorizedError(
      "Authentification du client requise",
      "INVALID_CLIENT",
    );
  }

  let clientId;
  let clientSecret;

  try {
    const credentials = Buffer.from(match[1], "base64").toString("utf8");

    const separator = credentials.indexOf(":");

    if (separator < 1) {
      throw new Error("Invalid credentials");
    }

    clientId = decodeURIComponent(credentials.slice(0, separator));

    clientSecret = decodeURIComponent(credentials.slice(separator + 1));
  } catch {
    throw new UnauthorizedError(
      "Identifiants client invalides",
      "INVALID_CLIENT",
    );
  }

  const application = await Application.findOne({
    clientId,
    status: "ACTIVE",
    clientType: "CONFIDENTIAL",
  }).select("+clientSecretHash");

  if (!application || !application.clientSecretHash || !clientSecret) {
    throw new UnauthorizedError("Client non autorisé", "INVALID_CLIENT");
  }

  const authenticated = await bcrypt.compare(
    clientSecret,
    application.clientSecretHash,
  );

  if (!authenticated) {
    throw new UnauthorizedError("Client non autorisé", "INVALID_CLIENT");
  }

  const token = req.body?.token;

  if (typeof token !== "string" || !token) {
    return res.status(200).json({
      active: false,
    });
  }

  const result = await validateAccessToken({
    token,
    expectedClientId: application.clientId,
  });

  res.set("Cache-Control", "no-store");

  return res.status(200).json(result);
});
