import { BadRequestError } from "../../shared/errors/index.js";

/**
 * Validation de la requête de connexion.
 */
export const validateLogin = (req, res, next) => {
  const { matricule, password } = req.body;

  const errors = [];

  if (!matricule || typeof matricule !== "string" || !matricule.trim()) {
    errors.push({
      field: "matricule",
      message: "Le matricule est obligatoire",
    });
  }

  if (!password || typeof password !== "string") {
    errors.push({
      field: "password",
      message: "Le mot de passe est obligatoire",
    });
  }

  if (errors.length > 0) {
    return next(
      new BadRequestError(
        "Données d'authentification invalides",
        "VALIDATION_ERROR",
        errors,
      ),
    );
  }

  /**
   * Normalisation.
   */
  req.body.matricule = matricule.trim().toUpperCase();

  next();
};
