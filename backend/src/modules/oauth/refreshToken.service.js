import crypto from "crypto";

import RefreshToken from "./refreshToken.model.js";

import { generateRandomToken, sha256 } from "../../shared/utils/crypto.js";

const DEFAULT_REFRESH_TOKEN_DURATION_SECONDS = 7 * 24 * 60 * 60;

/**
 * Création d'un Refresh Token opaque.
 *
 * Le token brut est retourné une seule fois.
 * MongoDB reçoit uniquement son hash SHA-256.
 */
export const createRefreshToken = async ({
  application,
  user,
  session,
  scopes,
  familyId = null,
  parentTokenId = null,
}) => {
  const refreshToken = generateRandomToken(48);

  const tokenHash = sha256(refreshToken);

  const effectiveFamilyId = familyId || crypto.randomUUID();

  const lifetime =
    application.refreshTokenLifetime || DEFAULT_REFRESH_TOKEN_DURATION_SECONDS;

  const expiresAt = new Date(Date.now() + lifetime * 1000);

  const document = await RefreshToken.create({
    tokenHash,
    familyId: effectiveFamilyId,

    parentToken: parentTokenId,

    application: application._id,

    user: user._id,

    session: session._id,

    scopes,
    expiresAt,
  });

  return {
    refreshToken,
    expiresAt,
    document,
  };
};

/**
 * Recherche d'un Refresh Token.
 *
 * Cette fonction retourne également USED/REVOKED afin
 * que nous puissions ultérieurement détecter la
 * réutilisation d'un ancien token.
 */
export const findRefreshToken = async (rawToken) => {
  if (!rawToken) {
    return null;
  }

  const tokenHash = sha256(rawToken);

  return RefreshToken.findOne({
    tokenHash,
  })
    .select("+tokenHash")
    .populate("application")
    .populate("user")
    .populate("session");
};

/**
 * Consommation atomique.
 *
 * Deux requêtes concurrentes ne doivent pas pouvoir
 * consommer le même Refresh Token.
 */
export const consumeRefreshToken = async (rawToken) => {
  if (!rawToken) {
    return null;
  }

  const tokenHash = sha256(rawToken);

  const now = new Date();

  return RefreshToken.findOneAndUpdate(
    {
      tokenHash,

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

export const setReplacement = async ({ refreshTokenId, replacementId }) => {
  await RefreshToken.updateOne(
    {
      _id: refreshTokenId,
    },
    {
      $set: {
        replacedBy: replacementId,
      },
    },
  );
};

export const revokeRefreshToken = async ({ refreshTokenId, reason }) => {
  await RefreshToken.updateOne(
    {
      _id: refreshTokenId,

      status: "ACTIVE",
    },
    {
      $set: {
        status: "REVOKED",

        revokedAt: new Date(),

        revokeReason: reason || null,
      },
    },
  );
};
export const revokeFamily = async ({ familyId, reason }) => {
  if (!familyId) return;

  const now = new Date();

  await RefreshToken.updateMany(
    {
      familyId,
      status: "ACTIVE",
    },
    {
      $set: {
        status: "REVOKED",
        revokedAt: now,
        revokeReason: reason || "REFRESH_TOKEN_FAMILY_REVOKED",
      },
    },
  );
};

export const revokeBySession = async ({
  sessionId,
  reason = "SESSION_REVOKED",
}) => {
  if (!sessionId) return;

  const now = new Date();

  return RefreshToken.updateMany(
    {
      session: sessionId,
      status: "ACTIVE",
    },
    {
      $set: {
        status: "REVOKED",
        revokedAt: now,
        revokeReason: reason,
      },
    },
  );
};
/**
 * Révoque tous les Refresh Tokens actifs
 * appartenant à un utilisateur.
 *
 * Utilisé lors de :
 * - suspension du compte
 * - désactivation du compte
 * - incident de sécurité
 * - révocation administrative globale
 */
export const revokeAllUserRefreshTokens = async (
  userId,
  reason = "USER_SESSIONS_REVOKED",
) => {
  if (!userId) {
    throw new Error("userId obligatoire");
  }

  const now = new Date();

  return RefreshToken.updateMany(
    {
      user: userId,
      status: "ACTIVE",
    },
    {
      $set: {
        status: "REVOKED",
        revokedAt: now,
        revokeReason: reason,
      },
    },
  );
};

/**
 * Révoque les Refresh Tokens actifs d'un utilisateur
 * pour une application précise.
 *
 * Les accès aux autres applications sont préservés.
 */
export const revokeByUserAndApplication = async ({
  userId,
  applicationId,
  reason = "APPLICATION_ACCESS_REVOKED",
}) => {
  if (!userId || !applicationId) {
    throw new Error("userId et applicationId sont obligatoires");
  }

  const now = new Date();

  return RefreshToken.updateMany(
    {
      user: userId,
      application: applicationId,
      status: "ACTIVE",
    },
    {
      $set: {
        status: "REVOKED",
        revokedAt: now,
        revokeReason: reason,
      },
    },
  );
};
