import express from "express";

import { openIdConfiguration, jwks, endSession } from "./oidc.controller.js";

const router = express.Router();

router.get("/openid-configuration", openIdConfiguration);

router.get("/jwks.json", jwks);
router.get("/end-session", endSession);

export default router;
