import { Router } from "express";

import {
  reactivateAccess,
  revokeAccess,
  suspendAccess,
  updateAccess,
  grantAccess,
  getAccess,
  listUserAccesses,
} from "./userApplicationAccess.controller.js";
import { requireSuperAdmin } from "../admin/adminAuth.middleware.js";
import { requireAdminOrigin } from "../admin/adminCsrf.middleware.js";

const router = Router();
router.use(requireSuperAdmin);
router.use(requireAdminOrigin);

router.post("/", grantAccess);

router.get("/users/:userId/applications/:applicationId", getAccess);

router.patch("/users/:userId/applications/:applicationId", updateAccess);

router.post(
  "/users/:userId/applications/:applicationId/suspend",
  suspendAccess,
);

router.post(
  "/users/:userId/applications/:applicationId/reactivate",
  reactivateAccess,
);

router.post("/users/:userId/applications/:applicationId/revoke", revokeAccess);
router.get("/users/:userId", listUserAccesses);

export default router;
