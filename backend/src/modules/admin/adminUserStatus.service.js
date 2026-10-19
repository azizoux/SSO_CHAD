import User from "../users/user.model.js";
import * as sessionService from "../sessions/session.service.js";

import * as refreshTokenService from "../oauth/refreshToken.service.js";

function businessError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function changeUserStatus({ targetUserId, adminUserId, action }) {
  if (!["SUSPEND", "ACTIVATE"].includes(action)) {
    throw businessError("Action non autorisée");
  }

  const user = await User.findById(targetUserId);

  if (!user) {
    throw businessError("Utilisateur introuvable", 404);
  }

  if (action === "SUSPEND") {
    if (String(user._id) === String(adminUserId)) {
      throw businessError(
        "Vous ne pouvez pas suspendre votre propre compte",
        403,
      );
    }

    if (user.roles?.includes("SUPER_ADMIN")) {
      throw businessError(
        "La suspension d'un SUPER_ADMIN nécessite une procédure renforcée",
        403,
      );
    }

    if (user.status === "DISABLED") {
      throw businessError("Un compte désactivé ne peut pas être suspendu");
    }

    user.status = "SUSPENDED";
    await user.save();

    const reason = "ACCOUNT_SUSPENDED";

    const sessionResult = await sessionService.revokeAllUserSessions(
      user._id,
      reason,
    );

    const refreshTokenResult =
      await refreshTokenService.revokeAllUserRefreshTokens(user._id, reason);

    return {
      user,
      revokedSessions: sessionResult.modifiedCount || 0,
      revokedRefreshTokens: refreshTokenResult.modifiedCount || 0,
    };
  }

  if (user.status !== "SUSPENDED") {
    throw businessError("Seul un compte suspendu peut être réactivé");
  }

  user.status = "ACTIVE";
  await user.save();

  return {
    user,
    revokedSessions: 0,
  };
}
