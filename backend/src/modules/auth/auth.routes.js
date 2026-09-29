import express from "express";

import { login } from "./auth.controller.js";
import { validateLogin } from "./auth.validators.js";

const router = express.Router();

/**
 * POST /api/v1/auth/login
 */
router.post("/login", validateLogin, login);

export default router;
