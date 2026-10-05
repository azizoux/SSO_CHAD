import * as authService from "./auth.service.js";

import asyncHandler from "../../shared/utils/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login({
    matricule: req.body.matricule,
    password: req.body.password,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get("user-agent") || null,
  });

  return res.status(200).json({
    success: true,
    message: "Authentification réussie",
    data: result,
  });
});
export const logout = asyncHandler(async (req, res) => {
  const sessionToken = req.headers["x-sso-session"];

  await authService.logout(sessionToken);

  return res.status(200).json({
    success: true,
    message: "Déconnexion effectuée avec succès",
  });
});
export const browserLogin = asyncHandler(async (req, res) => {
  const { matricule, password, return_to: returnTo } = req.body;

  const result = await authService.login({
    matricule,
    password,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get("user-agent") || null,
  });

  const sessionToken = result.session?.sessionToken;

  if (!sessionToken) {
    throw new Error("La session SSO a été créée sans sessionToken");
  }

  /*
   * Protection minimale contre les redirections externes.
   * La destination doit rester interne à CHAD-SSO.
   */
  const safeReturnTo =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
      ? returnTo
      : "/";

  /*
   * Cookie de session SSO centrale.
   *
   * Le token reste inaccessible au JavaScript du navigateur
   * grâce à HttpOnly.
   */
  res.cookie(process.env.SSO_COOKIE_NAME || "chad_sso_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });

  return res.redirect(302, safeReturnTo);
});
