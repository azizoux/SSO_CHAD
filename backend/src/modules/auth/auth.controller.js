import * as authService from "./auth.service.js";

import asyncHandler from "../../shared/utils/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login({
    matricule: req.body.matricule,
    password: req.body.password,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get("user-agent") || null,
  });

  return res.status(200).json({
    success: true,
    message: "Authentification réussie",
    data: result,
  });
});
