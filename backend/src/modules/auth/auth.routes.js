import express from "express";

import { login, logout, browserLogin } from "./auth.controller.js";
import { validateLogin } from "./auth.validators.js";

const router = express.Router();

/**
 * POST /api/v1/auth/login
 */
router.post("/login", validateLogin, login);
router.post("/logout", logout);
router.post("/browser-login", browserLogin);

export default router;
