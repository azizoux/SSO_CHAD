import express from "express";

import {
  createOrganization,
  deactivateOrganization,
  getOrganizationByCode,
  getOrganizationById,
  getOrganizations,
  updateOrganization,
} from "./organization.controller.js";
import { requireSuperAdmin } from "../admin/adminAuth.middleware.js";

const router = express.Router();
router.use(requireSuperAdmin);

/**
 * POST /api/v1/organizations
 */
router.post("/", createOrganization);

/**
 * GET /api/v1/organizations
 *
 * Exemples :
 * ?page=1&limit=20
 * ?search=finance
 * ?type=MINISTRY
 * ?status=ACTIVE
 */
router.get("/", getOrganizations);

/**
 * Important :
 * /code/:code doit être déclaré avant /:id
 */
router.get("/code/:code", getOrganizationByCode);

/**
 * GET /api/v1/organizations/:id
 */
router.get("/:id", getOrganizationById);

/**
 * PATCH /api/v1/organizations/:id
 */
router.patch("/:id", updateOrganization);

/**
 * DELETE logique.
 */
router.delete("/:id", deactivateOrganization);

export default router;
