import express from "express";

import { authorize, token, userInfo } from "./oauth.controller.js";

import { validateAuthorize, validateTokenRequest } from "./oauth.validators.js";

import { authenticateBearer } from "./oauth.middleware.js";

const router = express.Router();

router.get("/authorize", validateAuthorize, authorize);
router.post("/token", validateTokenRequest, token);
router.get("/userinfo", authenticateBearer, userInfo);

export default router;
