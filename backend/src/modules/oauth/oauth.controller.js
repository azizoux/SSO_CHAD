import * as oauthService from "./oauth.service.js";

import asyncHandler from "../../shared/utils/asyncHandler.js";

import { BadRequestError } from "../../shared/errors/index.js";

/**
 * Authorization Endpoint OAuth 2.x / OpenID Connect.
 *
 * Pour le démonstrateur CLI,
 * la session SSO est transmise via
 * l'en-tête x-sso-session.
 *
 * Plus tard, elle sera remplacée
 * par un cookie sécurisé HttpOnly.
 */
export const authorize = asyncHandler(async (req, res) => {
  const sessionToken = req.get("x-sso-session");

  const result = await oauthService.authorize({
    clientId: req.query.client_id,

    redirectUri: req.query.redirect_uri,

    responseType: req.query.response_type,

    scope: req.query.scope,

    state: req.query.state,

    codeChallenge: req.query.code_challenge,

    codeChallengeMethod: req.query.code_challenge_method,

    sessionToken,
  });

  return res.status(200).json({
    success: true,

    data: {
      code: result.code,

      state: result.state,

      redirectUri: result.redirectUri,
    },
  });
});

/**
 * Token Endpoint OAuth 2.x / OpenID Connect.
 *
 * Grants actuellement supportés :
 *
 * - authorization_code
 * - refresh_token
 *
 * authorization_code retourne :
 *
 * - Access Token
 * - ID Token
 * - Refresh Token
 *
 * refresh_token effectue une rotation
 * et retourne :
 *
 * - nouvel Access Token
 * - nouveau Refresh Token
 */
export const token = asyncHandler(async (req, res) => {
  let result;

  switch (req.body.grant_type) {
    case "authorization_code":
      result = await oauthService.exchangeAuthorizationCode({
        grantType: req.body.grant_type,

        code: req.body.code,

        redirectUri: req.body.redirect_uri,

        clientId: req.body.client_id,

        clientSecret: req.body.client_secret,

        codeVerifier: req.body.code_verifier,
      });

      break;

    case "refresh_token":
      result = await oauthService.exchangeRefreshToken({
        refreshToken: req.body.refresh_token,

        clientId: req.body.client_id,

        clientSecret: req.body.client_secret,
      });

      break;

    default:
      /*
       * Normalement intercepté avant ce point
       * par validateTokenRequest.
       *
       * Cette protection évite néanmoins
       * d'utiliser result alors qu'il serait
       * undefined si le controller était appelé
       * sans le validator.
       */
      throw new BadRequestError(
        "grant_type non supporté",
        "UNSUPPORTED_GRANT_TYPE",
      );
  }

  const response = {
    access_token: result.accessToken,

    token_type: "Bearer",

    expires_in: result.expiresIn,

    refresh_token: result.refreshToken,

    scope: result.scopes.join(" "),
  };

  /*
   * L'ID Token est actuellement émis
   * lors de l'Authorization Code flow.
   *
   * Il n'est pas systématiquement réémis
   * lors d'un refresh.
   */
  if (result.idToken) {
    response.id_token = result.idToken;
  }

  return res.status(200).json(response);
});

/**
 * OpenID Connect UserInfo Endpoint.
 *
 * req.accessToken est injecté par
 * authenticateBearer.
 */
export const userInfo = asyncHandler(async (req, res) => {
  const result = await oauthService.getUserInfo({
    subject: req.accessToken.sub,

    scope: req.accessToken.scope,
  });

  return res.status(200).json(result);
});
