import asyncHandler from "../../shared/utils/asyncHandler.js";
import * as oidcService from "./oidc.service.js";

/**
 * OpenID Connect Discovery.
 */
export const openIdConfiguration = (req, res) => {
  return res.status(200).json(oidcService.getOpenIdConfiguration());
};

/**
 * JSON Web Key Set.
 */
export const jwks = (req, res) => {
  return res.status(200).json(oidcService.getJwks());
};

/**
 * RP-Initiated Logout OIDC.
 */
export const endSession = asyncHandler(async (req, res) => {
  const result = await oidcService.endSession({
    idTokenHint: req.query.id_token_hint,
    postLogoutRedirectUri: req.query.post_logout_redirect_uri,
    state: req.query.state,
  });

  /*
   * Une réponse de logout ne doit pas
   * être mise en cache.
   */
  res.set("Cache-Control", "no-store");

  /*
   * Suppression du cookie SSO central.
   *
   * La session correspondante a déjà
   * été révoquée par oidcService.endSession().
   */
  res.clearCookie(process.env.SSO_COOKIE_NAME || "chad_sso_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  /*
   * Retour vers l'application cliente
   * si une URI de redirection valide
   * a été fournie.
   */
  if (result.redirectUri) {
    return res.redirect(302, result.redirectUri);
  }

  return res.status(200).json({
    success: true,
    message: "Déconnexion OIDC effectuée",
  });
});
