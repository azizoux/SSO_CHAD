import express from "express";

import {
  createApplication,
  deactivateApplication,
  getApplicationByClientId,
  getApplicationById,
  getApplications,
} from "./application.controller.js";

const router = express.Router();

/**
 * POST /api/v1/applications
 */
router.post("/", createApplication);

/**
 * GET /api/v1/applications
 *
 * Exemples :
 *
 * ?page=1&limit=20
 * ?search=sigfip
 * ?status=ACTIVE
 * ?clientType=CONFIDENTIAL
 * ?organization=<organizationId>
 */
router.get("/", getApplications);

/**
 * Recherche par clientId.
 *
 * Cette route doit être déclarée avant /:id.
 */
router.get("/client/:clientId", getApplicationByClientId);

/**
 * GET /api/v1/applications/:id
 */
router.get("/:id", getApplicationById);

/**
 * Désactivation logique.
 */
router.delete("/:id", deactivateApplication);

export default router;
