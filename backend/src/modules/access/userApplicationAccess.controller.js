import * as accessService from "./userApplicationAccess.service.js";

import asyncHandler from "../../shared/utils/asyncHandler.js";

export const grantAccess = asyncHandler(async (req, res) => {
  const access = await accessService.grantAccess({
    userId: req.body.userId,
    applicationId: req.body.applicationId,
    roles: req.body.roles,
    scopes: req.body.scopes,
    expiresAt: req.body.expiresAt,
    metadata: req.body.metadata,

    grantedBy: req.adminUser._id,
  });

  return res.status(201).json({
    success: true,
    message: "Habilitation accordée avec succès",
    data: access,
  });
});

export const getAccess = asyncHandler(async (req, res) => {
  const access = await accessService.getAccess({
    userId: req.params.userId,
    applicationId: req.params.applicationId,
  });

  if (!access) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ACCESS_NOT_FOUND",
        message: "Habilitation introuvable",
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: access,
  });
});

export const updateAccess = asyncHandler(async (req, res) => {
  const access = await accessService.updateAccess({
    userId: req.params.userId,
    applicationId: req.params.applicationId,
    roles: req.body.roles,
    scopes: req.body.scopes,
    expiresAt: req.body.expiresAt,
    metadata: req.body.metadata,
  });

  return res.status(200).json({
    success: true,
    message: "Habilitation mise à jour avec succès",
    data: access,
  });
});

export const suspendAccess = asyncHandler(async (req, res) => {
  const access = await accessService.suspendAccess({
    userId: req.params.userId,
    applicationId: req.params.applicationId,
  });

  return res.status(200).json({
    success: true,
    message: "Habilitation suspendue avec succès",
    data: access,
  });
});

export const reactivateAccess = asyncHandler(async (req, res) => {
  const access = await accessService.reactivateAccess({
    userId: req.params.userId,
    applicationId: req.params.applicationId,
  });

  return res.status(200).json({
    success: true,
    message: "Habilitation réactivée avec succès",
    data: access,
  });
});

export const revokeAccess = asyncHandler(async (req, res) => {
  const access = await accessService.revokeAccess({
    userId: req.params.userId,
    applicationId: req.params.applicationId,
    reason: req.body.reason || null,

    revokedBy: req.adminUser._id,
  });

  return res.status(200).json({
    success: true,
    message: "Habilitation révoquée avec succès",
    data: access,
  });
});
export const listUserAccesses = asyncHandler(async (req, res) => {
  const accesses = await accessService.listUserAccesses({
    userId: req.params.userId,
  });

  return res.status(200).json({
    success: true,
    count: accesses.length,
    data: accesses,
  });
});
