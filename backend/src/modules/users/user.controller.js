import * as userService from "./user.service.js";

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      organization: req.query.organization,
      status: req.query.status,
      role: req.query.role,
    });

    return res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserByMatricule = async (req, res, next) => {
  try {
    const user = await userService.getUserByMatricule(req.params.matricule);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const user = await userService.deactivateUser(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Utilisateur désactivé avec succès",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
