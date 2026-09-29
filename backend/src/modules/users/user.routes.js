import express from "express";

import {
  createUser,
  deactivateUser,
  getUserById,
  getUserByMatricule,
  getUsers,
  updateUser,
} from "./user.controller.js";

const router = express.Router();

/**
 * POST /api/v1/users
 */
router.post("/", createUser);

/**
 * GET /api/v1/users
 *
 * Exemples :
 *
 * ?page=1&limit=20
 * ?search=mahamat
 * ?organization=<organizationId>
 * ?status=ACTIVE
 * ?role=SUPER_ADMIN
 */
router.get("/", getUsers);

/**
 * Recherche par matricule.
 *
 * À déclarer avant /:id.
 */
router.get("/matricule/:matricule", getUserByMatricule);

/**
 * GET /api/v1/users/:id
 */
router.get("/:id", getUserById);

/**
 * PATCH /api/v1/users/:id
 */
router.patch("/:id", updateUser);

/**
 * Désactivation logique.
 */
router.delete("/:id", deactivateUser);

export default router;
