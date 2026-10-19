import express from "express";

import { requireSuperAdmin } from "./adminAuth.middleware.js";
import {
  me,
  dashboard,
  createStandardUser,
  updateUserProfile,
  suspendUser,
  activateUser,
} from "./admin.controller.js";

const router = express.Router();

router.use(requireSuperAdmin);

router.get("/me", me);
router.get("/dashboard", dashboard);
router.post("/users", createStandardUser);
router.patch("/users/:id/profile", updateUserProfile);
router.patch("/users/:id/suspend", suspendUser);
router.patch("/users/:id/activate", activateUser);

export default router;
