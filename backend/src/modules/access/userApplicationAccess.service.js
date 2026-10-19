import mongoose from "mongoose";

import UserApplicationAccess from "./userApplicationAccess.model.js";
import User from "../users/user.model.js";
import Application from "../applications/application.model.js";
import * as refreshTokenService from "../oauth/refreshToken.service.js";

import { BadRequestError, NotFoundError } from "../../shared/errors/index.js";

const normalizeStringArray = (values = []) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
};

const validateObjectId = (value, fieldName) => {
  if (!mongoose.isValidObjectId(value)) {
    throw new BadRequestError(`${fieldName} invalide`, "INVALID_OBJECT_ID");
  }
};

export const grantAccess = async ({
  userId,
  applicationId,
  roles = [],
  scopes = [],
  grantedBy = null,
  expiresAt = null,
  metadata = {},
}) => {
  validateObjectId(userId, "Utilisateur");
  validateObjectId(applicationId, "Application");

  if (grantedBy) {
    validateObjectId(grantedBy, "Auteur de l'habilitation");
  }

  const [user, application] = await Promise.all([
    User.findById(userId),
    Application.findById(applicationId),
  ]);

  if (!user) {
    throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");
  }

  if (!application) {
    throw new NotFoundError("Application introuvable", "APPLICATION_NOT_FOUND");
  }

  if (application.status !== "ACTIVE") {
    throw new BadRequestError(
      "L'application n'est pas active",
      "APPLICATION_NOT_ACTIVE",
    );
  }

  const normalizedRoles = normalizeStringArray(roles);
  const normalizedScopes = normalizeStringArray(scopes);

  const invalidScopes = normalizedScopes.filter(
    (scope) => !application.allowedScopes.includes(scope),
  );

  if (invalidScopes.length > 0) {
    throw new BadRequestError(
      `Scopes non autorisés : ${invalidScopes.join(", ")}`,
      "INVALID_APPLICATION_SCOPES",
    );
  }

  const existingAccess = await UserApplicationAccess.findOne({
    user: userId,
    application: applicationId,
  });

  if (existingAccess) {
    throw new BadRequestError(
      "Une habilitation existe déjà pour cet utilisateur et cette application",
      "ACCESS_ALREADY_EXISTS",
    );
  }

  return UserApplicationAccess.create({
    user: userId,
    application: applicationId,
    roles: normalizedRoles,
    scopes: normalizedScopes,
    status: "ACTIVE",
    grantedBy,
    grantedAt: new Date(),
    expiresAt,
    metadata,
  });
};

export const getAccess = async ({ userId, applicationId }) => {
  validateObjectId(userId, "Utilisateur");
  validateObjectId(applicationId, "Application");

  return UserApplicationAccess.findOne({
    user: userId,
    application: applicationId,
  })
    .populate("user", "_id matricule firstName lastName email status")
    .populate("application", "_id name code clientId status")
    .populate("grantedBy", "_id matricule firstName lastName")
    .populate("revokedBy", "_id matricule firstName lastName");
};

export const getActiveAccess = async ({ userId, applicationId }) => {
  validateObjectId(userId, "Utilisateur");
  validateObjectId(applicationId, "Application");

  const now = new Date();

  return UserApplicationAccess.findOne({
    user: userId,
    application: applicationId,
    status: "ACTIVE",

    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  });
};

export const updateAccess = async ({
  userId,
  applicationId,
  roles,
  scopes,
  expiresAt,
  metadata,
}) => {
  validateObjectId(userId, "Utilisateur");
  validateObjectId(applicationId, "Application");

  const update = {};

  if (roles !== undefined) {
    update.roles = normalizeStringArray(roles);
  }

  if (scopes !== undefined) {
    const application = await Application.findById(applicationId);

    if (!application) {
      throw new NotFoundError(
        "Application introuvable",
        "APPLICATION_NOT_FOUND",
      );
    }

    if (application.status !== "ACTIVE") {
      throw new BadRequestError(
        "L'application n'est pas active",
        "APPLICATION_NOT_ACTIVE",
      );
    }

    const normalizedScopes = normalizeStringArray(scopes);

    const invalidScopes = normalizedScopes.filter(
      (scope) => !application.allowedScopes.includes(scope),
    );

    if (invalidScopes.length > 0) {
      throw new BadRequestError(
        `Scopes non autorisés : ${invalidScopes.join(", ")}`,
        "INVALID_APPLICATION_SCOPES",
      );
    }

    update.scopes = normalizedScopes;
  }

  if (expiresAt !== undefined) {
    update.expiresAt = expiresAt;
  }

  if (metadata !== undefined) {
    update.metadata = metadata;
  }

  const access = await UserApplicationAccess.findOneAndUpdate(
    {
      user: userId,
      application: applicationId,
      status: { $ne: "REVOKED" },
    },
    {
      $set: update,
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!access) {
    throw new NotFoundError(
      "Habilitation active ou suspendue introuvable",
      "ACCESS_NOT_FOUND",
    );
  }

  /**
   * Invalider les refresh tokens après une modification
   * des autorisations ou de leur durée de validité.
   */
  if (roles !== undefined || scopes !== undefined || expiresAt !== undefined) {
    await refreshTokenService.revokeByUserAndApplication({
      userId,
      applicationId,
      reason: "APPLICATION_ACCESS_UPDATED",
    });
  }

  return access;
};

export const suspendAccess = async ({ userId, applicationId }) => {
  validateObjectId(userId, "Utilisateur");
  validateObjectId(applicationId, "Application");

  const access = await UserApplicationAccess.findOneAndUpdate(
    {
      user: userId,
      application: applicationId,
      status: "ACTIVE",
    },
    {
      $set: {
        status: "SUSPENDED",
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!access) {
    throw new NotFoundError(
      "Habilitation active introuvable",
      "ACCESS_NOT_FOUND",
    );
  }

  await refreshTokenService.revokeByUserAndApplication({
    userId,
    applicationId,
    reason: "APPLICATION_ACCESS_SUSPENDED",
  });

  return access;
};

export const reactivateAccess = async ({ userId, applicationId }) => {
  validateObjectId(userId, "Utilisateur");
  validateObjectId(applicationId, "Application");

  const access = await UserApplicationAccess.findOneAndUpdate(
    {
      user: userId,
      application: applicationId,
      status: "SUSPENDED",
    },
    {
      $set: {
        status: "ACTIVE",
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!access) {
    throw new NotFoundError(
      "Habilitation suspendue introuvable",
      "ACCESS_NOT_FOUND",
    );
  }

  return access;
};

export const revokeAccess = async ({
  userId,
  applicationId,
  revokedBy = null,
  reason = null,
}) => {
  validateObjectId(userId, "Utilisateur");
  validateObjectId(applicationId, "Application");

  if (revokedBy) {
    validateObjectId(revokedBy, "Auteur de la révocation");
  }

  const access = await UserApplicationAccess.findOneAndUpdate(
    {
      user: userId,
      application: applicationId,
      status: { $ne: "REVOKED" },
    },
    {
      $set: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedBy,
        revokeReason: reason,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!access) {
    throw new NotFoundError("Habilitation introuvable", "ACCESS_NOT_FOUND");
  }

  await refreshTokenService.revokeByUserAndApplication({
    userId,
    applicationId,
    reason: "APPLICATION_ACCESS_REVOKED",
  });

  return access;
};

export const listUserAccesses = async ({ userId }) => {
  validateObjectId(userId, "Utilisateur");

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");
  }

  return UserApplicationAccess.find({
    user: userId,
  })
    .populate("application", "_id name code clientId status")
    .populate("grantedBy", "_id matricule firstName lastName")
    .populate("revokedBy", "_id matricule firstName lastName")
    .sort({ createdAt: -1 })
    .lean();
};
