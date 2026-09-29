import AppError from "../errors/AppError.js";

const errorHandler = (error, req, res, next) => {
  /**
   * Erreurs métier connues de l'application.
   */
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,

      error: {
        code: error.code,
        message: error.message,

        ...(error.details && {
          details: error.details,
        }),
      },
    });
  }

  /**
   * MongoDB / Mongoose :
   * contrainte unique.
   */
  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,

      error: {
        code: "DUPLICATE_RESOURCE",
        message: "Une ressource avec ces informations existe déjà",
      },
    });
  }

  /**
   * ObjectId MongoDB invalide.
   */
  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,

      error: {
        code: "INVALID_IDENTIFIER",
        message: "Identifiant invalide",
      },
    });
  }

  /**
   * Validation Mongoose.
   */
  if (error?.name === "ValidationError") {
    const details = Object.values(error.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));

    return res.status(400).json({
      success: false,

      error: {
        code: "DATABASE_VALIDATION_ERROR",
        message: "Données invalides",
        details,
      },
    });
  }

  /**
   * Erreur inattendue.
   *
   * On journalise côté serveur,
   * mais on ne divulgue pas les détails
   * techniques au client.
   */
  console.error(error);

  return res.status(500).json({
    success: false,

    error: {
      code: "INTERNAL_ERROR",
      message: "Erreur interne du serveur",
    },
  });
};

export default errorHandler;
