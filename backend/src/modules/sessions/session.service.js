import Session from "./session.model.js";
import { generateRandomToken, sha256 } from "../../shared/utils/crypto.js";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export const createSession = async ({ userId, ipAddress, userAgent }) => {
  const sessionToken = generateRandomToken();

  const sessionTokenHash = sha256(sessionToken);

  const now = new Date();

  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  const session = await Session.create({
    sessionTokenHash,

    user: userId,

    ipAddress: ipAddress || null,
    userAgent: userAgent || null,

    authenticatedAt: now,
    lastActivityAt: now,

    expiresAt,

    status: "ACTIVE",
  });

  return {
    session,
    sessionToken,
  };
};

export const getSessionByToken = async (sessionToken) => {
  if (!sessionToken) {
    return null;
  }

  const sessionTokenHash = sha256(sessionToken);

  const session = await Session.findOne({
    sessionTokenHash,
  })
    .select("+sessionTokenHash")
    .populate(
      "user",
      "matricule firstName lastName email organization roles status",
    );

  if (!session) {
    return null;
  }

  if (session.status !== "ACTIVE") {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    return null;
  }

  return session;
};

export const revokeSession = async (sessionToken, reason = "LOGOUT") => {
  if (!sessionToken) {
    return null;
  }

  const sessionTokenHash = sha256(sessionToken);

  const session = await Session.findOne({
    sessionTokenHash,
  }).select("+sessionTokenHash");

  if (!session) {
    return null;
  }

  session.status = "REVOKED";
  session.revokedAt = new Date();
  session.revokeReason = reason;

  await session.save();

  return session;
};

export const revokeAllUserSessions = async (
  userId,
  reason = "SECURITY_ACTION",
) => {
  const now = new Date();

  return Session.updateMany(
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
// export const revokeBySession = async ({
//   sessionId,
//   reason = "SESSION_REVOKED",
// }) => {
//   if (!sessionId) {
//     return null;
//   }

//   const now = new Date();

//   return RefreshToken.updateMany(
//     {
//       session: sessionId,
//       status: "ACTIVE",
//     },
//     {
//       $set: {
//         status: "REVOKED",
//         revokedAt: now,
//         revokeReason: reason,
//       },
//     },
//   );
// };
export const revokeSessionById = async (sessionId, reason = "OIDC_LOGOUT") => {
  if (!sessionId) return null;

  return Session.findOneAndUpdate(
    {
      _id: sessionId,
      status: "ACTIVE",
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokeReason: reason,
      },
    },
    {
      returnDocument: "after",
    },
  );
};
export const registerParticipant = async ({
  sessionId,
  applicationId,
  clientId,
}) => {
  if (!sessionId || !applicationId || !clientId) {
    return null;
  }

  /*
   * $addToSet empêcherait uniquement les doublons
   * strictement identiques, joinedAt rendrait chaque
   * objet différent.
   *
   * Nous utilisons donc une mise à jour conditionnelle
   * sur participants.application.
   */
  return Session.findOneAndUpdate(
    {
      _id: sessionId,
      status: "ACTIVE",
      expiresAt: { $gt: new Date() },
      "participants.application": { $ne: applicationId },
    },
    {
      $push: {
        participants: {
          application: applicationId,
          clientId,
          joinedAt: new Date(),
        },
      },
      $set: {
        lastActivityAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  );
};
