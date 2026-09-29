import crypto from "crypto";

import { oidcConfig } from "../../config/oidc.js";

/**
 * Retourne le document
 * OpenID Connect Discovery.
 *
 * Il permet aux applications clientes
 * de découvrir automatiquement
 * les endpoints et capacités de CHAD-SSO.
 */
export const getOpenIdConfiguration = () => {
  return {
    issuer: oidcConfig.issuer,

    authorization_endpoint: `${oidcConfig.issuer}/api/v1/oauth/authorize`,

    token_endpoint: `${oidcConfig.issuer}/api/v1/oauth/token`,
    userinfo_endpoint: `${oidcConfig.issuer}/api/v1/oauth/userinfo`,

    jwks_uri: `${oidcConfig.issuer}/.well-known/jwks.json`,

    response_types_supported: ["code"],

    response_modes_supported: ["query"],

    grant_types_supported: ["authorization_code"],

    subject_types_supported: ["public"],

    id_token_signing_alg_values_supported: ["RS256"],

    scopes_supported: ["openid", "profile", "email"],

    token_endpoint_auth_methods_supported: ["client_secret_post", "none"],

    code_challenge_methods_supported: ["S256"],

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
  };
};

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
