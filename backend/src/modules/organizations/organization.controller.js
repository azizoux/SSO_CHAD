import * as organizationService from "./organization.service.js";

export const createOrganization = async (req, res, next) => {
  try {
    const organization = await organizationService.createOrganization(req.body);

    return res.status(201).json({
      success: true,
      message: "Organisation créée avec succès",
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizations = async (req, res, next) => {
  try {
    const result = await organizationService.getOrganizations({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      type: req.query.type,
      status: req.query.status,
    });

    return res.status(200).json({
      success: true,
      data: result.organizations,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationById = async (req, res, next) => {
  try {
    const organization = await organizationService.getOrganizationById(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationByCode = async (req, res, next) => {
  try {
    const organization = await organizationService.getOrganizationByCode(
      req.params.code,
    );

    return res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const organization = await organizationService.updateOrganization(
      req.params.id,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Organisation mise à jour avec succès",
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateOrganization = async (req, res, next) => {
  try {
    const organization = await organizationService.deactivateOrganization(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      message: "Organisation désactivée avec succès",
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};
