import bcrypt from "bcryptjs";

import User from "../users/user.model.js";

import * as sessionService from "../sessions/session.service.js";
import * as refreshTokenService from "../oauth/refreshToken.service.js";

import {
  UnauthorizedError,
  ForbiddenError,
  AppError,
} from "../../shared/errors/index.js";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;

const LOCK_DURATION_MS = 15 * 60 * 1000;

/**
 * Authentifie un utilisateur.
 *
 * La validation structurelle de la requête
 * est réalisée par auth.validators.js.
 */
export const login = async ({ matricule, password, ipAddress, userAgent }) => {
  /**
   * Recherche volontairement le hash
   * du mot de passe.
   */
  const user = await User.findOne({
    matricule,
  }).select("+passwordHash");

  /**
   * Message générique afin d'éviter
   * l'énumération des comptes.
   */
  if (!user) {
    throw new UnauthorizedError(
      "Matricule ou mot de passe incorrect",
      "INVALID_CREDENTIALS",
    );
  }

  /**
   * Compte explicitement interdit.
   */
  if (user.status === "SUSPENDED" || user.status === "DISABLED") {
    throw new ForbiddenError("Compte non autorisé", "ACCOUNT_DISABLED");
  }

  const now = new Date();

  /**
   * Verrouillage encore actif.
   */
  if (user.status === "LOCKED" && user.lockedUntil && user.lockedUntil > now) {
    throw new AppError(
      "Compte temporairement verrouillé",
      423,
      "ACCOUNT_LOCKED",
      {
        lockedUntil: user.lockedUntil,
      },
    );
  }

  /**
   * Le délai de verrouillage est terminé.
   *
   * Le compte peut de nouveau
   * tenter de s'authentifier.
   */
  if (
    user.status === "LOCKED" &&
    (!user.lockedUntil || user.lockedUntil <= now)
  ) {
    user.status = "ACTIVE";
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;

    await user.save();
  }

  /**
   * Vérification du mot de passe.
   */
  const passwordValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    user.lastFailedLoginAt = now;

    /**
     * Verrouillage après le nombre
     * maximal d'échecs.
     */
    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.status = "LOCKED";

      user.lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);
    }

    await user.save();

    throw new UnauthorizedError(
      "Matricule ou mot de passe incorrect",
      "INVALID_CREDENTIALS",
    );
  }

  /**
   * Authentification réussie.
   */
  user.failedLoginAttempts = 0;
  user.lastFailedLoginAt = null;
  user.lockedUntil = null;
  user.lastLoginAt = now;

  if (user.status === "LOCKED") {
    user.status = "ACTIVE";
  }

  await user.save();

  /**
   * Création de la session SSO.
   */
  const { session, sessionToken } = await sessionService.createSession({
    userId: user._id,
    ipAddress,
    userAgent,
  });

  /**
   * Le hash du mot de passe ne doit
   * jamais quitter le service.
   */
  const safeUser = user.toObject();

  delete safeUser.passwordHash;

  return {
    user: safeUser,
    session: {
      sessionToken,
      authenticatedAt: session.authenticatedAt,
      expiresAt: session.expiresAt,
    },
  };
};
export const logout = async (sessionToken) => {
  if (!sessionToken) {
    return {
      success: true,
    };
  }

  const session = await sessionService.getSessionByToken(sessionToken);

  if (!session) {
    return {
      success: true,
    };
  }

  await sessionService.revokeSession(sessionToken, "LOGOUT");

  await refreshTokenService.revokeBySession({
    sessionId: session._id,
    reason: "SESSION_LOGOUT",
  });

  return {
    success: true,
  };
};
