import { BadRequestError } from "../../shared/errors/index.js";

/**
 * Validation de GET /oauth/authorize.
 *
 * Cette couche valide uniquement
 * la structure de la requête.
 *
 * Les règles métier restent dans
 * oauth.service.js :
 * - existence du client
 * - redirect URI autorisée
 * - scopes autorisés
 * - session SSO valide
 */
export const validateAuthorize = (req, res, next) => {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    code_challenge,
    code_challenge_method,
  } = req.query;

  const errors = [];

  if (!client_id || typeof client_id !== "string") {
    errors.push({
      field: "client_id",
      message: "client_id est obligatoire",
    });
  }

  if (!redirect_uri || typeof redirect_uri !== "string") {
    errors.push({
      field: "redirect_uri",
      message: "redirect_uri est obligatoire",
    });
  }

  if (response_type !== "code") {
    errors.push({
      field: "response_type",
      message: "response_type doit être code",
    });
  }

  if (!scope || typeof scope !== "string") {
    errors.push({
      field: "scope",
      message: "scope est obligatoire",
    });
  }

  if (!code_challenge || typeof code_challenge !== "string") {
    errors.push({
      field: "code_challenge",
      message: "code_challenge est obligatoire",
    });
  }

  if (code_challenge_method !== "S256") {
    errors.push({
      field: "code_challenge_method",
      message: "code_challenge_method doit être S256",
    });
  }

  if (errors.length > 0) {
    return next(
      new BadRequestError(
        "Requête OAuth invalide",
        "OAUTH_VALIDATION_ERROR",
        errors,
      ),
    );
  }

  next();
};

/**
 * Validation de POST /oauth/token.
 *
 * Pour l'instant CHAD-SSO supporte
 * authorization_code uniquement.
 */
export const validateTokenRequest = (req, res, next) => {
  const errors = [];

  const grantType = req.body?.grant_type;

  if (!grantType) {
    errors.push({
      field: "grant_type",
      message: "grant_type est obligatoire",
    });
  }

  if (
    grantType &&
    !["authorization_code", "refresh_token"].includes(grantType)
  ) {
    errors.push({
      field: "grant_type",
      message: "grant_type non supporté",
    });
  }

  if (grantType === "authorization_code") {
    if (!req.body?.code) {
      errors.push({
        field: "code",
        message: "code est obligatoire",
      });
    }

    if (!req.body?.redirect_uri) {
      errors.push({
        field: "redirect_uri",
        message: "redirect_uri est obligatoire",
      });
    }

    if (!req.body?.client_id) {
      errors.push({
        field: "client_id",
        message: "client_id est obligatoire",
      });
    }

    if (!req.body?.code_verifier) {
      errors.push({
        field: "code_verifier",
        message: "code_verifier est obligatoire",
      });
    }
  }

  if (grantType === "refresh_token") {
    if (!req.body?.refresh_token) {
      errors.push({
        field: "refresh_token",
        message: "refresh_token est obligatoire",
      });
    }

    if (!req.body?.client_id) {
      errors.push({
        field: "client_id",
        message: "client_id est obligatoire",
      });
    }
  }

  if (errors.length > 0) {
    return next(
      new BadRequestError(
        "Requête token invalide",
        "OAUTH_TOKEN_VALIDATION_ERROR",
        errors,
      ),
    );
  }

  return next();
};
