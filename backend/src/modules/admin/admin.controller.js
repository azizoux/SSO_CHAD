import asyncHandler from "../../shared/utils/asyncHandler.js";
import * as adminService from "./admin.service.js";

import { changeUserStatus } from "./adminUserStatus.service.js";

export const me = asyncHandler(async (req, res) => {
  const user = req.adminUser;

  return res.status(200).json({
    success: true,
    data: {
      id: user._id,
      matricule: user.matricule,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles,
      organization: user.organization,
    },
  });
});

export const dashboard = asyncHandler(async (req, res) => {
  const statistics = await adminService.getDashboardStatistics();

  return res.status(200).json({
    success: true,
    data: statistics,
  });
});
import * as userService from "../users/user.service.js";

export const createStandardUser = async (req, res, next) => {
  try {
    const user = await userService.createUser({
      matricule: req.body.matricule,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      organization: req.body.organization,
      password: req.body.password,
      roles: ["USER"],
    });

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
export const updateUserProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "organization",
    ];

    const payload = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    }

    if (!Object.keys(payload).length) {
      return res.status(400).json({
        success: false,
        message: "Aucun champ modifiable fourni",
      });
    }

    const user = await userService.updateUser(req.params.id, payload);

    return res.status(200).json({
      success: true,
      message: "Fiche utilisateur mise à jour",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const suspendUser = async (req, res, next) => {
  try {
    const result = await changeUserStatus({
      targetUserId: req.params.id,
      adminUserId: req.adminUser._id,
      action: "SUSPEND",
    });

    return res.status(200).json({
      success: true,
      message: "Utilisateur suspendu avec succès",
      data: {
        user: result.user,
        revokedSessions: result.revokedSessions,
        revokedRefreshTokens: result.revokedRefreshTokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const activateUser = async (req, res, next) => {
  try {
    const result = await changeUserStatus({
      targetUserId: req.params.id,
      adminUserId: req.adminUser._id,
      action: "ACTIVATE",
    });

    return res.status(200).json({
      success: true,
      message: "Utilisateur réactivé avec succès",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
