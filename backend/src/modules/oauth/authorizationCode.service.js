import AuthorizationCode from "./authorizationCode.model.js";

import { generateRandomToken, sha256 } from "../../shared/utils/crypto.js";

const AUTHORIZATION_CODE_DURATION_MS = 5 * 60 * 1000;

/**
 * Crée un Authorization Code OAuth.
 *
 * Le code brut est retourné une seule fois.
 * Seul son hash SHA-256 est stocké en base.
 */
export const createAuthorizationCode = async ({
  applicationId,
  userId,
  sessionId,
  redirectUri,
  scopes,
  nonce,
  codeChallenge,
  codeChallengeMethod,
}) => {
  const code = generateRandomToken();
  const codeHash = sha256(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUTHORIZATION_CODE_DURATION_MS);

  await AuthorizationCode.create({
    codeHash,
    application: applicationId,
    user: userId,
    session: sessionId,
    redirectUri,
    scopes,
    nonce,
    codeChallenge,
    codeChallengeMethod,
    status: "ACTIVE",
    expiresAt,
  });

  /**
   * Ne jamais retourner codeHash.
   */
  return {
    code,
    expiresAt,
  };
};

/**
 * Recherche un Authorization Code
 * encore actif.
 *
 * Cette fonction peut rester utile
 * pour diagnostic ou futurs traitements,
 * mais elle ne doit PAS être utilisée
 * pour l'échange /oauth/token.
 *
 * /oauth/token utilise exclusivement
 * consumeAuthorizationCode() afin de
 * garantir une consommation atomique.
 */
export const getAuthorizationCode = async (code) => {
  if (!code) {
    return null;
  }

  const codeHash = sha256(code);

  const authorizationCode = await AuthorizationCode.findOne({
    codeHash,
  })
    .select("+codeHash")
    .populate("application")
    .populate("user")
    .populate("session");

  if (!authorizationCode) {
    return null;
  }

  if (authorizationCode.status !== "ACTIVE") {
    return null;
  }

  if (authorizationCode.expiresAt <= new Date()) {
    return null;
  }

  return authorizationCode;
};

/**
 * Consomme atomiquement un
 * Authorization Code.
 *
 * Un même code ne peut être utilisé
 * qu'une seule fois.
 */
export const consumeAuthorizationCode = async ({
  code,
  applicationId,
  redirectUri,
  codeChallenge,
}) => {
  if (!code) {
    return null;
  }

  const codeHash = sha256(code);

  const now = new Date();

  return AuthorizationCode.findOneAndUpdate(
    {
      codeHash,

      application: applicationId,

      redirectUri,

      codeChallenge,

      codeChallengeMethod: "S256",

      status: "ACTIVE",

      expiresAt: {
        $gt: now,
      },
    },
    {
      $set: {
        status: "USED",

        usedAt: now,
      },
    },
    { returnDocument: "after" },
  )
    .populate("application")
    .populate("user")
    .populate("session");
};
