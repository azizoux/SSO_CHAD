import NotFoundError from "../errors/NotFoundError.js";

const notFoundHandler = (req, res, next) => {
  next(
    new NotFoundError(
      `Route introuvable : ${req.method} ${req.originalUrl}`,
      "ROUTE_NOT_FOUND",
    ),
  );
};

export default notFoundHandler;
