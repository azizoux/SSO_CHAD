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
