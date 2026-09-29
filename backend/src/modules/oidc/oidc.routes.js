import express from "express";

import { openIdConfiguration, jwks } from "./oidc.controller.js";

const router = express.Router();

router.get("/openid-configuration", openIdConfiguration);

router.get("/jwks.json", jwks);

export default router;
